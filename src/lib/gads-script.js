// gads-script.js in /lib/  -  full script without SHEET_URL (added in app)
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

function main() {
    try {
        const spreadsheet = getOrCreateSpreadsheet();
        const elements = defineElements();
        const queries = buildQueries(elements);

        const datasets = [
            { name: 'hourly_today', query: queries.hourlyTodayQuery },
            { name: 'hourly_yesterday', query: queries.hourlyYesterdayQuery },
            { name: 'daily', query: queries.dailyMetricsQuery },
            { name: 'thirty_days', query: queries.thirtyDaysQuery },
            { name: 'settings', query: queries.campaignSettingsQuery },
            { name: 'products', query: queries.topProductsQuery },
            { name: 'match_types', query: queries.matchTypesQuery },
            { name: 'search_terms', query: queries.searchTermsQuery },
            { name: 'channels', query: queries.channelTypeSpendQuery },
            { name: 'pmax', query: queries.pMaxSubChannelQuery },
            { name: 'previous_thirty_days', query: queries.previousThirtyDaysQuery },
            { name: 'seven_days', query: queries.sevenDaysQuery },
            { name: 'previous_seven_days', query: queries.previousSevenDaysQuery }
        ];

        for (const { name, query } of datasets) {
            processDataset(spreadsheet, name, query);
        }

        if (!SHEET_URL) {
            DriveApp.getFileById(spreadsheet.getId())
                .setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        }
        
        Logger.log(`Spreadsheet available at: ${spreadsheet.getUrl()}`);
    } catch (error) {
        Logger.log(`Script failed with error: ${error.message}`);
    }
}

function processDataset(spreadsheet, name, query) {
    let retryCount = 0;
    while (retryCount < MAX_RETRIES) {
        try {
            const data = fetchData(query);
            if (data?.length) {
                const sheet = getOrCreateSheet(spreadsheet, name);
                if (sheet) {
                    sheet.clear();
                    populateSheet(sheet, data);
                    break;
                }
            } else {
                Logger.log(`No data available for ${name}`);
                break;
            }
        } catch (error) {
            retryCount++;
            if (retryCount === MAX_RETRIES) {
                Logger.log(`Error processing ${name}: ${error.message}`);
            } else {
                Utilities.sleep(RETRY_DELAY * retryCount);
            }
        }
    }
}

function getOrCreateSheet(spreadsheet, name) {
    let sheet = spreadsheet.getSheetByName(name);
    let retryCount = 0;
    
    while (!sheet && retryCount < MAX_RETRIES) {
        try {
            sheet = spreadsheet.insertSheet(name);
        } catch (error) {
            retryCount++;
            if (retryCount === MAX_RETRIES) return null;
            Utilities.sleep(RETRY_DELAY * retryCount);
        }
    }
    return sheet;
}

function populateSheet(sheet, data) {
    if (!data?.length) return;
    const headers = Object.keys(data[0]);
    const values = [headers].concat(data.map(row => headers.map(header => row[header])));
    sheet.getRange(1, 1, values.length, headers.length).setValues(values);
}

function getDateRanges() {
    const timezone = AdsApp.currentAccount().getTimeZone();
    const today = new Date();
    
    const getRange = (start, end) => ({
        start: Utilities.formatDate(new Date(today.getTime() - start * 86400000), timezone, 'yyyy-MM-dd'),
        end: Utilities.formatDate(new Date(today.getTime() - end * 86400000), timezone, 'yyyy-MM-dd')
    });
    
    return {
        last30Days: getRange(30, 1),
        previous30Days: getRange(60, 31),
        last7Days: getRange(7, 1),
        previous7Days: getRange(14, 8),
        last100Days: getRange(100, 1)
    };
}

function fetchData(query) {
    try {
        const data = [];
        const iterator = AdsApp.search(query, { 'apiVersion': 'v18' });
        while (iterator.hasNext()) {
            data.push(flattenObject(iterator.next()));
        }
        return transformHeaders(data);
    } catch (error) {
        Logger.log(`Query error: ${error.message}`);
        return null;
    }
}

function flattenObject(obj) {
    const result = {};
    const recurse = (obj, prefix = '') => {
        Object.entries(obj).forEach(([key, value]) => {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (value && typeof value === 'object') {
                recurse(value, newKey);
            } else {
                result[newKey] = value;
            }
        });
    };
    recurse(obj);
    return result;
}

function getOrCreateSpreadsheet() {
    try {
        if (SHEET_URL && SHEET_URL.length > 0) {
            return SpreadsheetApp.openByUrl(SHEET_URL);
        } 
    } catch (error) {
        throw new Error(`Failed to access/create spreadsheet: ${error.message}`);
    }
}

function buildQueries(e) {
    let queries = {};
    let dateRanges = getDateRanges();

    queries.hourlyTodayQuery = `
        SELECT ${[e.segHour, e.campName, e.campId, e.conv, e.clicks, e.cost,
        e.value, e.impr, e.searchBudgetLost, e.searchShare, e.searchRankLost].join(',')}
        FROM campaign 
        WHERE segments.date DURING TODAY
        ORDER BY segments.hour ASC`;

    queries.hourlyYesterdayQuery = `
        SELECT ${[e.segHour, e.campName, e.campId, e.conv, e.clicks, e.cost,
        e.value, e.impr, e.searchBudgetLost, e.searchShare, e.searchRankLost].join(',')}
        FROM campaign 
        WHERE segments.date DURING YESTERDAY
        ORDER BY segments.hour ASC`;

    queries.dailyMetricsQuery = `
        SELECT ${[e.segDate, e.campName, e.campId, e.conv, e.clicks, e.cost,
        e.value, e.impr, e.searchBudgetLost, e.searchShare, e.searchRankLost].join(',')}
        FROM campaign 
        WHERE segments.date BETWEEN "${dateRanges.last100Days.start}" AND "${dateRanges.last100Days.end}"
        ORDER BY segments.date DESC`;

        queries.thirtyDaysQuery = `
        SELECT ${[e.campName, e.campId, e.conv, e.clicks, e.cost,
        e.value, e.impr, e.searchBudgetLost, e.searchShare, e.searchRankLost].join(',')}
        FROM campaign 
        WHERE segments.date BETWEEN "${dateRanges.last30Days.start}" AND "${dateRanges.last30Days.end}"
        ORDER BY metrics.cost_micros DESC`;

    queries.previousThirtyDaysQuery = `
        SELECT ${[e.campName, e.campId, e.conv, e.clicks, e.cost,
        e.value, e.impr, e.searchBudgetLost, e.searchShare, e.searchRankLost].join(',')}
        FROM campaign 
        WHERE segments.date BETWEEN "${dateRanges.previous30Days.start}" AND "${dateRanges.previous30Days.end}"
        ORDER BY metrics.cost_micros DESC`;

    queries.sevenDaysQuery = `
        SELECT ${[e.campName, e.campId, e.conv, e.clicks, e.cost,
        e.value, e.impr, e.searchBudgetLost, e.searchShare, e.searchRankLost].join(',')}
        FROM campaign 
        WHERE segments.date BETWEEN "${dateRanges.last7Days.start}" AND "${dateRanges.last7Days.end}"
        ORDER BY metrics.cost_micros DESC`;

    queries.previousSevenDaysQuery = `
        SELECT ${[e.campName, e.campId, e.conv, e.clicks, e.cost,
        e.value, e.impr, e.searchBudgetLost, e.searchShare, e.searchRankLost].join(',')}
        FROM campaign 
        WHERE segments.date BETWEEN "${dateRanges.previous7Days.start}" AND "${dateRanges.previous7Days.end}"
        ORDER BY metrics.cost_micros DESC`;

    queries.campaignSettingsQuery = `
        SELECT ${[e.biddingStrategy, e.biddingStatus, e.biddingType, e.budget,
        e.campaignGroup, e.chType, e.chSubType, e.optStatus, e.campId,
        e.labels, e.campName, e.targetCPA, e.targetROAS, e.cpcCeiling,
        e.rtbOptIn, e.primaryReasons, e.primaryStatus, e.servingStatus,
        e.status, e.urlOptOut].join(',')}
        FROM campaign
        ORDER BY campaign.name ASC`;

    queries.topProductsQuery = `
        SELECT ${[e.prodId, e.prodTitle, e.impr, e.clicks, e.cost, e.conv, e.value].join(',')}
        FROM shopping_performance_view 
        WHERE segments.date DURING LAST_7_DAYS 
        ORDER BY metrics.cost_micros DESC 
        LIMIT 500`;

    queries.matchTypesQuery = `
        SELECT ${[e.keywordMatchType, e.impr, e.clicks, e.cost, e.conv, e.value].join(',')}
        FROM keyword_view 
        WHERE segments.date DURING LAST_7_DAYS`;

    queries.searchTermsQuery = `
        SELECT ${[e.searchTerm, e.impr, e.clicks, e.cost, e.conv, e.value].join(',')}
        FROM search_term_view 
        WHERE segments.date DURING LAST_7_DAYS 
        AND metrics.impressions > 0`;

    queries.channelTypeSpendQuery = `
        SELECT ${[e.chType, e.impr, e.cost, e.conv, e.value].join(',')}
        FROM campaign 
        WHERE segments.date DURING LAST_30_DAYS`;

    queries.pMaxSubChannelQuery = `
        SELECT ${[e.segDate, e.impr, e.cost, e.conv, e.value].join(',')}
        FROM campaign 
        WHERE segments.date DURING LAST_7_DAYS 
        AND campaign.advertising_channel_type = "PERFORMANCE_MAX"`;

    return queries;
}

function transformHeaders(data) {
    if (!data || data.length === 0) return data;
    
    return data.map(row => {
        const transformedRow = {};
        Object.entries(row).forEach(([key, value]) => {
            // Find the field definition that matches this key
            const fieldDef = Object.values(FIELD_DEFINITIONS).find(def => def.query.trim() === key);
            if (fieldDef) {
                // Apply any transform function if it exists
                const transformedValue = fieldDef.transform ? fieldDef.transform(value) : value;
                transformedRow[fieldDef.header] = transformedValue;
            } else {
                transformedRow[key] = value;
            }
        });
        return transformedRow;
    });
}

function defineElements() {
    const elements = {};
    for (const [key, value] of Object.entries(FIELD_DEFINITIONS)) {
        elements[key] = value.query;
    }
    return elements;
}

function getHeaderMapping() {
    const mapping = {};
    for (const [_, value] of Object.entries(FIELD_DEFINITIONS)) {
        const queryField = value.query.trim();
        mapping[queryField] = value.header;
    }
    return mapping;
}

const FIELD_DEFINITIONS = {
    segHour: { query: ' segments.hour ', header: 'Hour' },
    segDate: { query: ' segments.date ', header: 'Date' },
    campName: { query: ' campaign.name ', header: 'Campaign' },
    campId: { query: ' campaign.id ', header: 'CampaignId' },
    conv: { query: ' metrics.conversions ', header: 'Conversions' },
    clicks: { query: ' metrics.clicks ', header: 'Clicks' },
    cost: { query: ' metrics.cost_micros ', header: 'Cost', transform: value => value / 1000000 },
    value: { query: ' metrics.conversions_value ', header: 'ConvValue' },
    impr: { query: ' metrics.impressions ', header: 'Impressions' },
    searchBudgetLost: { query: ' metrics.search_budget_lost_impression_share ', header: 'LostToBudget' },
    searchShare: { query: ' metrics.search_impression_share ', header: 'ImprShare' },
    searchRankLost: { query: ' metrics.search_rank_lost_impression_share ', header: 'LostToRank' },
    biddingStrategy: { query: ' campaign.bidding_strategy ', header: 'BidStrategy' },
    biddingStatus: { query: ' campaign.bidding_strategy_system_status ', header: 'BidStatus' },
    biddingType: { query: ' campaign.bidding_strategy_type ', header: 'BidType' },
    budget: { query: ' campaign.campaign_budget ', header: 'Budget' },
    campaignGroup: { query: ' campaign.campaign_group ', header: 'Group' },
    chType: { query: ' campaign.advertising_channel_type ', header: 'Channel' },
    chSubType: { query: ' campaign.advertising_channel_sub_type ', header: 'SubChannel' },
    optStatus: { query: ' campaign.ad_serving_optimization_status ', header: 'OptStatus' },
    labels: { query: ' campaign.labels ', header: 'Labels' },
    targetCPA: { query: ' campaign.maximize_conversions.target_cpa_micros ', header: 'TargetCPA', transform: value => value / 1000000 },
    targetROAS: { query: ' campaign.maximize_conversion_value.target_roas ', header: 'TargetROAS' },
    cpcCeiling: { query: ' campaign.percent_cpc.cpc_bid_ceiling_micros ', header: 'MaxCPC', transform: value => value / 1000000 },
    rtbOptIn: { query: ' campaign.real_time_bidding_setting.opt_in ', header: 'RTBOptIn' },
    primaryReasons: { query: ' campaign.primary_status_reasons ', header: 'StatusReasons' },
    primaryStatus: { query: ' campaign.primary_status ', header: 'PrimaryStatus' },
    servingStatus: { query: ' campaign.serving_status ', header: 'ServingStatus' },
    status: { query: ' campaign.status ', header: 'Status' },
    urlOptOut: { query: ' campaign.url_expansion_opt_out ', header: 'OptOutURLExp' },
    allConv: { query: ' metrics.all_conversions ', header: 'AllConversions' },
    allConvValue: { query: ' metrics.all_conversions_value ', header: 'AllConvValue' },
    convDate: { query: ' metrics.conversions_by_conversion_date ', header: 'ConvByDate' },
    convValueDate: { query: ' metrics.conversions_value_by_conversion_date ', header: 'ConvValueByDate' },
    avgCpc: { query: ' metrics.average_cpc ', header: 'AvgCPC' },
    views: { query: ' metrics.video_views ', header: 'Views' },
    cpv: { query: ' metrics.average_cpv ', header: 'AvgCPV' },
    prodChannel: { query: ' segments.product_channel ', header: 'ProductChannel' },
    prodId: { query: ' segments.product_item_id ', header: 'ProductId' },
    prodTitle: { query: ' segments.product_title ', header: 'ProductTitle' },
    keywordText: { query: ' ad_group_criterion.keyword.text ', header: 'KeywordText' },
    keywordMatchType: { query: ' ad_group_criterion.keyword.match_type ', header: 'KeywordMatchType' },
    searchTerm: { query: ' search_term_view.search_term ', header: 'SearchTerm' },
    assetInteractionTarget: { query: ' segments.asset_interaction_target.asset ', header: 'AssetInteraction' },
    interactionOnAsset: { query: ' segments.asset_interaction_target.interaction_on_this_asset ', header: 'AssetInteractionCount' }
};