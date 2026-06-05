export const ALLOWED_TOOL_NAMES = Object.freeze([
  "extract_assets",
  "get_hot_report",
  "get_real_time_market_summary",
  "get_market_analysis",
  "get_macro_analysis",
  "get_asset_overview",
  "get_real_time_record",
  "analyze_capital_flow",
  "analyze_technical",
  "analyze_fundamentals_financial",
  "analyze_fundamentals_valuation",
  "investment_search_pro",
  "compare_assets",
  "screen_stocks",
  "get_etf_constituents",
  "get_index_related_etfs",
  "get_stock_belongings",
  "get_caidazi_user_watchlist",
  "get_caidazi_positions_summary",
  "get_caidazi_portfolio_snapshot",
]);

export const ALLOWED_TOOL_SET = new Set(ALLOWED_TOOL_NAMES);

export function isAllowedTool(toolName) {
  return ALLOWED_TOOL_SET.has(toolName);
}
