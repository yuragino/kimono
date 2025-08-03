document.addEventListener('alpine:init', () => {
  Alpine.data('kimonoApp', () => ({
    categoryMap: {
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
    items: [],
    loading: true,

    init() {
      const urlParams = new URLSearchParams(window.location.search);
      const cat = urlParams.get("category");
      if (cat && this.categoryMap[cat]) this.category = cat;
      this.loadItems();
    },

    setCategory(name) {
      this.category = name;
      const url = new URL(window.location);
      url.searchParams.set('category', name);
      window.history.pushState({}, '', url);
      this.loadItems();
    },

    async loadItems() {
      this.loading = true;
      try {
        const res = await fetch(`data/${this.categoryMap[this.category]}`);
        this.items = await res.json();
      } catch (e) {
        console.error("読み込み失敗", e);
        this.items = [];
      }
      this.loading = false;
    },

    get sortedItems() {
      return [...this.items].sort((a, b) => {
        return this.sortBy === "身丈_asc"
          ? a["身丈"] - b["身丈"]
          : b["身丈"] - a["身丈"];
      });
    },

    getHipSize(width) {
      const map = {
        27: "84cm以下", 28: "89cm以下", 29: "94cm以下",
        30: "99cm以下", 31: "104cm以下", 32: "109cm以下",
        33: "114cm以下", 34: "119cm以下"
      };
      return map[width] || "サイズ不明";
    },

    getHeightRange(mitake) {
      return this.category === "浴衣"
        ? `${mitake - 7}cm〜${mitake + 8}cm`
        : `${mitake - 5}cm〜${mitake + 5}cm`;
    },

    stableUrl(url) {
      const match = url.match(/id=([^&]+)/);
      return match ? `https://lh3.googleusercontent.com/d/${match[1]}` : url;
    }
  }));

  Alpine.data('imageSlider', item => ({
    images: [
      item["画像URL"],
      ...["パターンb", "パターンc", "パターンd", "パターンe", "パターンf", "パターンg"].map(k => item[k]).filter(Boolean)
    ],
    index: 0,
    fileName: item["ファイル名"].match(/(\d{3}[a-z]?)/)?.[1] || '',
    prev() { this.index = (this.index - 1 + this.images.length) % this.images.length },
    next() { this.index = (this.index + 1) % this.images.length }
  }));
});