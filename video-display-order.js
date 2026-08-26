(() => {
  const grid16Items = [...window.GRID_16_GENERATION_DATA, ...window.GRID_16_EXTRA_DATA];
  const grid16ByTitle = new Map(grid16Items.map((item) => [item.title, item]));
  window.GRID_16_DISPLAY_DATA = [
  "3dcgi_10",
  "anime_7",
  "stopmotion_15",
  "realistic_2",
  "3dcgi_15",
  "stopmotion_19",
  "realistic_20",
  "realistic_12",
  "3dcgi_17",
  "realistic_3",
  "realistic_7",
  "stopmotion_7",
  "cinema_9",
  "3dcgi_6",
  "3dcgi_8",
  "3dcgi_13",
  "anime_4",
  "realistic_19",
  "stopmotion_20",
  "cinema_20",
  "cinema_4",
  "cinema_18",
  "stopmotion_18",
  "cinema_8",
  "3dcgi_7",
  "cinema_6"
].map((title) => grid16ByTitle.get(title));

  const grid64ByTitle = new Map(window.GRID_SCALING_DATA.map((item) => [item.title, item]));
  window.GRID_SCALING_DISPLAY_DATA = [
  "case_030",
  "story_080",
  "story_076",
  "story_068",
  "case_044",
  "story_053",
  "case_025",
  "story_060",
  "case_009",
  "story_079",
  "case_013",
  "case_001",
  "case_036",
  "case_035",
  "case_045",
  "case_007",
  "case_048",
  "case_012"
].map((title) => grid64ByTitle.get(title));
})();
