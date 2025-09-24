export function getHeightRange(category, mitake) {
  return category === "浴衣"
    ? `${mitake - 7}cm〜${mitake + 8}cm`
    : `${mitake - 5}cm〜${mitake + 5}cm`;
}

export function getHipSize(backWidth) {
  const hipSizeMap = {
    27: "84cm以下", 28: "89cm以下", 29: "94cm以下",
    30: "99cm以下", 31: "104cm以下", 32: "109cm以下",
    33: "114cm以下", 34: "119cm以下"
  };
  return hipSizeMap[backWidth] || "サイズ不明";
}

export function convertGoogleDriveUrl(driveShareUrl) {
  const urlObj = new URL(driveShareUrl);
  const fileId = urlObj.searchParams.get("id");
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}
