import { firestore } from "./firebase.js";
import { getHeightRange, getHipSize, convertGoogleDriveUrl } from './utils.js';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
document.addEventListener('alpine:init', () => {
  Alpine.data('kimonoApp', () => ({
    kimonoCategories: {
      "浴衣": {
        jsonFileName: "yukata.json",
        seasonMonths: [6, 7, 8, 9]
      },
      "単衣": {
        jsonFileName: "hitoe.json",
        seasonMonths: [5, 6, 9, 10]
      },
      "小紋": {
        jsonFileName: "komon.json",
        seasonMonths: [10, 11, 12, 1, 2, 3, 4, 5]
      },
      "アンティーク": {
        jsonFileName: "meisen.json",
        seasonMonths: [10, 11, 12, 1, 2, 3, 4, 5]
      }
    },
    sortBy: "身丈_asc",
    category: new URLSearchParams(location.search).get('category') ?? '浴衣',
    // データ
    kimonoRecords: [],
    rentals: [],
    favorites: [],
    // UI状態
    loading: true,
    errorMessage: '',
    showFavorites: false,
    showOnlyRented: false,
    isRentalModalOpen: false,
    // ユーザー状態
    isAdmin: false,
    // モーダル関連
    rentalDate: '',
    rentalTargetFileName: '',

    // --- 算出プロパティ ---
    get sortedKimonoRecords() {
      const compareByMitake = this.sortBy === "身丈_asc"
        ? (a, b) => a["身丈"] - b["身丈"]
        : (a, b) => b["身丈"] - a["身丈"];
      let list = [...this.kimonoRecords];
      if (this.showOnlyRented === true) {
        list = list.filter(record => this.isRented(record['ファイル名']));
      }
      return list.sort(compareByMitake);
    },

    get favoriteRecords() {
      return this.kimonoRecords.filter(record =>
        this.favorites.includes(record['ファイル名'])
      );
    },

    // --- 初期化処理 ---
    init() {
      this.loadKimonoRecords();
      this.listenRentals();
      const saved = localStorage.getItem('kimonoFavorites');
      this.favorites = saved ? JSON.parse(saved) : [];
    },

    // UI関連メソッド
    getHeightRange(mitake) {
      return getHeightRange(this.category, mitake);
    },
    getHipSize(backWidth) {
      return getHipSize(backWidth);
    },
    setCategory(categoryName) {
      this.category = categoryName;
      const urlObj = new URL(window.location);
      urlObj.searchParams.set('category', categoryName);
      this.loadKimonoRecords();
    },

    // データ取得・更新メソッド
    async loadKimonoRecords() {
      this.loading = true;
      try {
        const jsonFileName = this.kimonoCategories[this.category].jsonFileName;
        const response = await fetch(`data/${jsonFileName}`);
        this.kimonoRecords = await response.json();
      } catch (error) {
        console.error("読み込み失敗", error);
        this.kimonoRecords = [];
        this.errorMessage = 'データの読み込みに失敗しました。ページを再読み込みしても直らない場合は管理者にお伝えください。';
      } finally {
        this.loading = false;
      }
    },

    toggleFavorite(imageFileName) {
      if (this.favorites.includes(imageFileName)) {
        this.favorites = this.favorites.filter(favFileName => favFileName !== imageFileName);
      } else {
        this.favorites.push(imageFileName);
      }
      localStorage.setItem('kimonoFavorites', JSON.stringify(this.favorites));
    },

    isFavorite(imageFileName) {
      return this.favorites.includes(imageFileName);
    },

    // --- 管理者ログイン関連 ---
    async adminLogin() {
      const code = prompt("こちらは管理者モードです。管理者でない場合はキャンセルを押してください。");
      if (!code) return;
      const storedHash = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";
      const inputHash = await sha256(code);
      if (inputHash === storedHash) {
        this.isAdmin = true;
      } else {
        alert("パスコードが間違っています。");
      }
    },

    logoutAdmin() {
      this.isAdmin = false;
      this.showOnlyRented = false;
    },

    // --- 貸出予約関連 ---
    listenRentals() {
      firestore.collection("rentals").onSnapshot(snapShot => {
        this.rentals = snapShot.docs.map(doc => ({
          id: doc.id,
          imageFileName: doc.data().imageFileName,
          createdAt: doc.data().createdAt.toDate(),
          rentalDate: doc.data().rentalDate.toDate(),
          rentalStartDate: doc.data().rentalStartDate.toDate(),
          rentalEndDate: doc.data().rentalEndDate.toDate(),
        }));
        this.checkAndCleanRentals();
      });
    },

    checkAndCleanRentals() {
      const now = new Date();
      this.rentals.forEach(rental => {
        if (now > rental.rentalEndDate) {
          firestore.collection("rentals").doc(rental.id).delete();
        }
      });
    },

    // モーダル開閉
    openRentalModal(imageFileName) {
      this.rentalTargetFileName = imageFileName;
      this.rentalDate = new Date().toISOString().slice(0, 10);
      this.isRentalModalOpen = true;
    },

    closeRentalModal() {
      this.isRentalModalOpen = false;
      this.rentalDate = '';
      this.rentalTargetFileName = '';
    },

    // 貸出登録・解除
    rentalsFor(imageFileName) {
      return this.rentals
        .filter(record => record.imageFileName === imageFileName)
        .sort((a, b) => (a.rentalStartDate?.getTime() || 0) - (b.rentalStartDate?.getTime() || 0));
    },

    async submitRental() {
      if (this.rentalDate === "") {
        alert("貸出日を入力してください。");
        return;
      }
      const rentalDateObj = new Date(this.rentalDate);
      await firestore.collection("rentals").add({
        imageFileName: this.rentalTargetFileName,
        rented: true,
        createdAt: new Date(),
        rentalDate: rentalDateObj,
        rentalStartDate: new Date(rentalDateObj.getTime() - ONE_WEEK_MS),
        rentalEndDate: new Date(rentalDateObj.getTime() + ONE_WEEK_MS),
      });
      this.closeRentalModal();
    },

    async cancelRental(rentalId) {
      await firestore.collection("rentals").doc(rentalId).delete();
    },

    // 貸出状態判定・表示
    isRented(imageFileName) {
      return this.rentals.some(record => record.imageFileName === imageFileName);
    },

    formatRentalDateRange(rental) {
      const options = { month: "numeric", day: "numeric" };
      const startStr = rental.rentalStartDate ? rental.rentalStartDate.toLocaleDateString("ja-JP", options) : "";
      const endStr = rental.rentalEndDate ? rental.rentalEndDate.toLocaleDateString("ja-JP", options) : "";
      return `貸出予約中 ${startStr} 〜 ${endStr}`;
    },

  }));

  Alpine.data('imageSlider', kimonoRecord => ({
    mainImageUrl: kimonoRecord['画像URL'],
    additionalImageKeys: ['パターンb', 'パターンc', 'パターンd', 'パターンe', 'パターンf', 'パターンg'],
    currentImageIndex: 0,
    fileNumber: kimonoRecord['ファイル名'].match(/\d{3}/)?.[0] || '',
    // 追加画像URL配列を動的に生成
    get additionalImageUrls() {
      return this.additionalImageKeys.map(key => kimonoRecord[key]).filter(Boolean);
    },
    // メイン画像と追加画像をまとめた「全画像URLリスト」
    get allImageUrls() {
      return [this.mainImageUrl, ...this.additionalImageUrls];
    },
    prev() {
      if (this.currentImageIndex === 0) {
        this.currentImageIndex = this.allImageUrls.length - 1;
      } else {
        this.currentImageIndex--;
      }
    },
    next() {
      if (this.currentImageIndex === this.allImageUrls.length - 1) {
        this.currentImageIndex = 0;
      } else {
        this.currentImageIndex++;
      }
    },
    convertGoogleDriveUrl(driveShareUrl) {
      return convertGoogleDriveUrl(driveShareUrl);
    },
  }));
});
// cSpell:ignore mitake firestore yukata hitoe komon meisen