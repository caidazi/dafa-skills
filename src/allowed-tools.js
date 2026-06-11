export const ALLOWED_TOOL_NAMES = Object.freeze([
  "extract_assets",
  "investment_search_pro",
  "get_asset_overview",
  "get_real_time_record",
  "get_market_analysis",
  "get_hot_report",
  "get_index_related_etfs",
  "get_etf_constituents",
  "get_stock_belongings",
  "get_real_time_market_summary",
  "get_macro_analysis",
  "analyze_capital_flow",
  "analyze_technical",
  "analyze_fundamentals_financial",
  "analyze_fundamentals_valuation",
  "compare_assets",
  "screen_stocks",
  "get_caidazi_user_watchlist",
  "add_caidazi_watchlist",
  "remove_caidazi_watchlist",
  "get_caidazi_monitor_tasks",
  "get_caidazi_positions_summary",
  "get_caidazi_portfolio_snapshot",
  "analyze_event_impact",
  "analyze_earnings_result",
  "preview_earnings",
  "get_sector_radar",
  "sector_deep_dive",
  "relative_valuation",
  "intrinsic_valuation",
  "generate_asset_report",
]);

export const ALLOWED_TOOL_SET = new Set(ALLOWED_TOOL_NAMES);

export function isAllowedTool(toolName) {
  return ALLOWED_TOOL_SET.has(toolName);
}
