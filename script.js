import { firestore } from "./firebase.js";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
document.addEventListener('alpine:init', () => {
  Alpine.data('kimonoApp', () => ({
    kimonoCategories: {
      "浴衣": {
        fileName: "yukata.json",
        seasonMonths: [6, 7, 8, 9]
      },
      "単衣": {
        fileName: "hitoe.json",
        seasonMonths: [5, 6, 9, 10]
      },
      "小紋": {
        fileName: "komon.json",
        seasonMonths: [10, 11, 12, 1, 2, 3, 4, 5]
      },
      "アンティーク": {
        fileName: "meisen.json",
        seasonMonths: [10, 11, 12, 1, 2, 3, 4, 5]
      }
    },

    category: new URLSearchParams(location.search).get('category') ?? '浴衣',
    sortBy: "身丈_asc",
    kimonoRecords: [],
    loading: true,

    favorites: [], //お気に入りにした画像のファイル名を格納
    showFavorites: false,

    isAdmin: false,
    rentals: [],  // 貸出中のファイル名を格納

    init() {
      this.listenRentals();

      const saved = localStorage.getItem('kimonoFavorites');
      this.favorites = saved ? JSON.parse(saved) : [];

      this.loadKimonoRecords();
    },

    get sortedKimonoRecords() {
      const compareByMitake = this.sortBy === "身丈_asc"
        ? (a, b) => a["身丈"] - b["身丈"]
        : (a, b) => b["身丈"] - a["身丈"];
      return [...this.kimonoRecords].sort(compareByMitake);
    },

    get favoriteRecords() {
      return this.kimonoRecords.filter(record =>
        this.favorites.includes(record['ファイル名'])
      );
    },

    listenRentals() {
      firestore.collection("rentals").onSnapshot(snapShot => {
        this.rentals = snapShot.docs.map(doc => ({
          id: doc.id,
          createdAt: doc.data().createdAt.toDate()
        }));
        this.checkAndCleanRentals();
      });
    },

    checkAndCleanRentals() {
      const now = new Date();
      this.rentals.forEach(rental => {
        const createdAt = rental.createdAt;
        if ((now - createdAt) > SEVEN_DAYS_MS) {
          firestore.collection("rentals").doc(rental.id).delete();
        }
      });
    },

    setCategory(categoryName) {
      this.category = categoryName;
      const urlObj = new URL(window.location);
      urlObj.searchParams.set('category', categoryName);
      window.history.pushState({}, '', urlObj);
      this.loadKimonoRecords();
    },

    async loadKimonoRecords() {
      this.loading = true;
      try {
        const fileName = this.kimonoCategories[this.category].fileName;
        const response = await fetch(`data/${fileName}`);
        this.kimonoRecords = await response.json();
      } catch (error) {
        console.error("読み込み失敗", error);
        this.kimonoRecords = [];
      } finally {
        this.loading = false;
      }
    },


    getHipSize(backWidth) {
      const hipSizeMap = {
        27: "84cm以下", 28: "89cm以下", 29: "94cm以下",
        30: "99cm以下", 31: "104cm以下", 32: "109cm以下",
        33: "114cm以下", 34: "119cm以下"
      };
      return hipSizeMap[backWidth] || "サイズ不明";
    },

    getHeightRange(mitake) {
      return this.category === "浴衣"
        ? `${mitake - 7}cm〜${mitake + 8}cm`
        : `${mitake - 5}cm〜${mitake + 5}cm`;
    },

    convertGoogleDriveUrl(driveShareUrl) {
      const urlObj = new URL(driveShareUrl);
      const fileId = urlObj.searchParams.get("id");
      return `https://lh3.googleusercontent.com/d/${fileId}`
    },

    toggleFavorite(fileName) {
      if (this.favorites.includes(fileName)) {
        this.favorites = this.favorites.filter(f => f !== fileName);
      } else {
        this.favorites.push(fileName);
      }
      localStorage.setItem('kimonoFavorites', JSON.stringify(this.favorites));
    },

    isFavorite(fileName) {
      return this.favorites.includes(fileName);
    },

    // SHA-256ハッシュ
    adminLogin() {
      const code = prompt("管理者でない場合はキャンセルを押してください。");
      if (!code) return;

      const storedHash = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";

      // ハッシュ化関数（async）
      async function sha256(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      sha256(code).then(inputHash => {
        if (inputHash === storedHash) {
          this.isAdmin = true;
        } else {
          alert("パスコードが間違っています。");
        }
      });
    },

    logoutAdmin() {
      this.isAdmin = false;
    },

    isRented(fileName) {
      return this.rentals.some(record => record.id === fileName);
    },

    async toggleRental(fileName) {
      if (this.isRented(fileName)) {
        await firestore.collection("rentals").doc(fileName).delete();
      } else {
        await firestore.collection("rentals").doc(fileName).set({
          rented: true,
          createdAt: new Date(),
        })
      }
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
  }));
});
// cSpell:ignore mitake firestore