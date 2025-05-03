function convertToStableUrl(originalUrl) {
  const match = originalUrl.match(/id=([^&]+)/);
  return match ? `https://lh3.googleusercontent.com/d/${match[1]}` : originalUrl;
}

const categoryMap = {
  "浴衣": "yukata.json",
  "単衣": "hitoe.json",
  "小紋": "komon.json",
  "銘仙": "meisen.json"
};

function getHipSize(width) {
  const map = {
    27: "84cm以下", 28: "89cm以下", 29: "94cm以下",
    30: "99cm以下", 31: "104cm以下", 32: "109cm以下",
    33: "114cm以下", 34: "119cm以下"
  };
  return map[width] || "サイズ不明";
}

function getHeightRange(mitage) {
  return `${mitage - 5}cm〜${mitage + 5}cm`;
}

async function renderItems() {
  const category = document.getElementById("category").value;
  const color = document.getElementById("color").value;
  const pattern = document.getElementById("pattern").value;
  const list = document.getElementById("list");
  list.innerHTML = "<p>読み込み中...</p>";

  try {
    const response = await fetch(`data/${categoryMap[category]}`);
    const items = await response.json();

    const filteredItems = items.filter(item => {
      const matchColor = color === "" || item.色?.includes(color);
      const matchPattern = pattern === "" || item.柄?.includes(pattern); 
      return matchColor && matchPattern;
    });

    list.innerHTML = "";

    if (filteredItems.length === 0) {
      list.innerHTML = "<p>条件に一致するデータがありません。</p>";
      return;
    }

    filteredItems.forEach(item => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <img src="${convertToStableUrl(item.画像URL)}" alt="着物画像">
          <details>
          <summary>サイズ詳細</summary>
          <table>
            <tr><th>身丈</th><td>${item["身丈"]}cm</td></tr>
            <tr><th>後幅</th><td>${item["後幅"]}cm</td></tr>
            <tr><th>裄</th><td>${item["裄"]}cm</td></tr>
          </table>
        </details>
        <table>
          <tr><th>推奨身長</th><td>${getHeightRange(item["身丈"])}</td></tr>
          <tr><th>ヒップサイズ</th><td>${getHipSize(item["後幅"])}</td></tr>
        </table>
      `;
      list.appendChild(div);
    });


  } catch (error) {
    list.innerHTML = `<p>データの読み込みに失敗しました。</p>`;
    console.error("JSON読み込みエラー:", error);
  }
}

renderItems(); // 初期表示
