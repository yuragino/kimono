import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getHeightRange, getHipSize } from './utils.js';
const firebaseConfig = {
  apiKey: "AIzaSyBOMtAoCObyoalTk6_nVpGlsnLcGSw4Jzc",
  authDomain: "kimono-coordinate.firebaseapp.com",
  projectId: "kimono-coordinate",
  storageBucket: "kimono-coordinate.appspot.com",
  messagingSenderId: "399031825104",
  appId: "1:399031825104:web:46539ee3ede037c45724d5",
  measurementId: "G-ETTRN5YVXN"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("alpine:init", () => {
  Alpine.data("app", () => ({
    category: new URLSearchParams(location.search).get("category") || "小紋",
    subFilter: (new URLSearchParams(location.search).get("subCategory") || "")
      .split(",").filter(Boolean),
    sort: new URLSearchParams(location.search).get("sort") || "heightAsc",
    items: [],
    showFavorites: false,
    favorites: JSON.parse(localStorage.getItem("kimonoFavorites") || "[]"),

    getHeightRange(mitake) {
      return getHeightRange(this.category, mitake);
    },

    getHipSize(backWidth) {
      return getHipSize(backWidth);
    },

    async init() {
      await this.fetchItems();
      this.$watch("sort", () => this.updateUrl());
      this.$watch("subFilter", () => this.updateUrl());
    },

    async fetchItems() {
      const snap = await getDocs(collection(db, this.category));
      this.items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    changeCategory(cat) {
      this.category = cat;
      this.updateUrl();
      this.fetchItems();
    },

    updateUrl() {
      const params = new URLSearchParams();
      params.set("category", this.category);
      if (this.subFilter.length > 0) params.set("subCategory", this.subFilter.join(","));
      params.set("sort", this.sort);
      history.replaceState(null, "", "?" + params.toString());
    },

    get filteredAndSorted() {
      let arr = [...this.items];
      // --- subFilter の絞り込み処理追加 ---
      if (this.subFilter.length > 0) {
        arr = arr.filter(item => this.subFilter.includes(item.subCategory));
      }
      if (this.sort === "heightAsc") arr.sort((a, b) => (a.size?.height || 0) - (b.size?.height || 0));
      if (this.sort === "heightDesc") arr.sort((a, b) => (b.size?.height || 0) - (a.size?.height || 0));
      return arr;
    },

    toggleFavorite(id) {
      if (this.favorites.includes(id)) {
        this.favorites = this.favorites.filter(f => f !== id);
      } else {
        this.favorites.push(id);
      }
      localStorage.setItem("kimonoFavorites", JSON.stringify(this.favorites));
    },

    isFavorite(id) {
      return this.favorites.includes(id);
    },

    get favoriteRecords() {
      return this.items.filter(item => this.favorites.includes(item.id));
    },

    // --- 日付表示 ---
    formatRentalDateRange(rental) {
      const toDate = d => d?.toDate ? d.toDate() : new Date(d);
      const options = { month: "numeric", day: "numeric" };
      const startStr = toDate(rental.rentalStartDate).toLocaleDateString("ja-JP", options);
      const endStr = toDate(rental.rentalEndDate).toLocaleDateString("ja-JP", options);
      return `予約 ${startStr} 〜 ${endStr}`;
    }

  }));
});