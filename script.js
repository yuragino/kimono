document.addEventListener('alpine:init', () => {
  Alpine.data('kimonoApp', () => ({
    kimonoDataFiles: {
      "浴衣": "yukata.json",
      "単衣": "hitoe.json",
      "小紋": "komon.json",
      "アンティーク": "meisen.json"
    },
    seasonInfo: {
      "浴衣": "6〜9月",
      "単衣": "5,6,9,10月",
      "小紋": "10〜5月",
      "アンティーク": "10〜5月"
    },
    category: "浴衣",
    sortBy: "身丈_asc",
    kimonoRecords: [],
    loading: true,

    init() {
      const urlParams = new URLSearchParams(window.location.search);
      this.category = urlParams.get("category");
      this.loadKimonoRecords();
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
        const response = await fetch(`data/${this.kimonoDataFiles[this.category]}`);
        this.kimonoRecords = await response.json();
      } catch (error) {
        console.error("読み込み失敗", error);
        this.kimonoRecords = [];
      } finally {
        this.loading = false;
      }
    },

    get sortedKimonoRecords() {
      const compareByMitake = this.sortBy === "身丈_asc"
        ? (a, b) => a["身丈"] - b["身丈"]
        : (a, b) => b["身丈"] - a["身丈"];
      return [...this.kimonoRecords].sort(compareByMitake);
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

    /**
   * Google Drive の共有URLを直接表示可能な画像URLに変換する
   * @param {string} driveShareUrl - Google Drive の共有リンク
   * @returns {string} 表示可能な画像URL
   */
    convertGoogleDriveUrl(driveShareUrl) {
      const urlObj = new URL(driveShareUrl);
      const fileId = urlObj.searchParams.get("id");
      return `https://lh3.googleusercontent.com/d/${fileId}`
    }
  }));

  Alpine.data('imageSlider', kimonoRecord => ({
    mainImageUrl: kimonoRecord['画像URL'],
    additionalImageKeys: ['パターンb', 'パターンc', 'パターンd', 'パターンe', 'パターンf', 'パターンg'],

    // 追加画像URL配列を動的に生成
    get additionalImageUrls() {
      return this.additionalImageKeys.map(key => kimonoRecord[key]).filter(Boolean);
    },

    // メイン画像と追加画像をまとめた「全画像URLリスト」
    get allImageUrls() {
      return [this.mainImageUrl, ...this.additionalImageUrls];
    },

    currentImageIndex: 0,
    fileName: kimonoRecord['ファイル名'].match(/\d{3}/)?.[0] || '',

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
// cSpell:ignore mitake