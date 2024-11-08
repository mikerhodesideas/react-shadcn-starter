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

function defineElements() {
    const elements = {};
    Object.entries(FIELD_DEFINITIONS).forEach(([key, def]) => {
        elements[key] = def.query;
    });
    return elements;
}

function buildQueries(e) {
    const dateRanges = getDateRanges();
    
    // Helper function to join fields with proper spacing
    const joinFields = fields => fields.map(f => ` ${f} `).join(',');
    
    return {
        hourlyTodayQuery: `
            SELECT ${joinFields([e.segHour, e.campName, e.campId, e.conv, e.clicks, e.cost,
                e.value, e.impr, e.searchBudgetLost, e.searchShare, e.searchRankLost])}
            FROM campaign 
            WHERE segments.date DURING TODAY
            ORDER BY segments.hour ASC`,
            
        // ... other queries similarly updated ...
        
        campaignSettingsQuery: `
            SELECT ${joinFields([e.biddingStrategy, e.biddingStatus, e.biddingType, e.budget,
                e.campaignGroup, e.chType, e.chSubType, e.optStatus, e.campId,
                e.labels, e.campName, e.targetCPA, e.targetROAS, e.cpcCeiling,
                e.rtbOptIn, e.primaryReasons, e.primaryStatus, e.servingStatus,
                e.status, e.urlOptOut])}
            FROM campaign
            ORDER BY campaign.name ASC`
    };
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
    const dateRanges = getDateRanges();
    const joinFields = fields => fields.map(f => ` ${f} `).join(',');
    

    queries.hourlyTodayQuery = `
        SELECT ${joinFields([e.segHour, e.campName, e.campId, e.conv, e.clicks, e.cost,
        e.value, e.impr, e.searchBudgetLost, e.searchShare, e.searchRankLost])}
        FROM campaign 
        WHERE segments.date DURING TODAY
        ORDER BY segments.hour ASC`;

    queries.hourlyYesterdayQuery = `
        SELECT ${joinFields([e.segHour, e.campName, e.campId, e.conv, e.clicks, e.cost,
        e.value, e.impr, e.searchBudgetLost, e.searchShare, e.searchRankLost])}
        FROM campaign 
        WHERE segments.date DURING YESTERDAY
        ORDER BY segments.hour ASC`;

    queries.dailyMetricsQuery = `
        SELECT ${joinFields([e.segDate, e.campName, e.campId, e.conv, e.clicks, e.cost,
        e.value, e.impr, e.searchBudgetLost, e.searchShare, e.searchRankLost])}
        FROM campaign 
        WHERE segments.date BETWEEN "${dateRanges.last100Days.start}" AND "${dateRanges.last100Days.end}"
        ORDER BY segments.date DESC`;

    queries.thirtyDaysQuery = `
        SELECT ${joinFields([e.campName, e.campId, e.conv, e.clicks, e.cost,
        e.value, e.impr, e.searchBudgetLost, e.searchShare, e.searchRankLost])}
        FROM campaign 
        WHERE segments.date BETWEEN "${dateRanges.last30Days.start}" AND "${dateRanges.last30Days.end}"
        ORDER BY metrics.cost_micros DESC`;

    queries.previousThirtyDaysQuery = `
        SELECT ${joinFields([e.campName, e.campId, e.conv, e.clicks, e.cost,
        e.value, e.impr, e.searchBudgetLost, e.searchShare, e.searchRankLost])}
        FROM campaign 
        WHERE segments.date BETWEEN "${dateRanges.previous30Days.start}" AND "${dateRanges.previous30Days.end}"
        ORDER BY metrics.cost_micros DESC`;

    queries.sevenDaysQuery = `
        SELECT ${joinFields([e.campName, e.campId, e.conv, e.clicks, e.cost,
        e.value, e.impr, e.searchBudgetLost, e.searchShare, e.searchRankLost])}
        FROM campaign 
        WHERE segments.date BETWEEN "${dateRanges.last7Days.start}" AND "${dateRanges.last7Days.end}"
        ORDER BY metrics.cost_micros DESC`;

    queries.previousSevenDaysQuery = `
        SELECT ${joinFields([e.campName, e.campId, e.conv, e.clicks, e.cost,
        e.value, e.impr, e.searchBudgetLost, e.searchShare, e.searchRankLost])}
        FROM campaign 
        WHERE segments.date BETWEEN "${dateRanges.previous7Days.start}" AND "${dateRanges.previous7Days.end}"
        ORDER BY metrics.cost_micros DESC`;

    queries.campaignSettingsQuery = `
        SELECT ${joinFields([e.biddingStrategy, e.biddingStatus, e.biddingType, e.budget,
        e.campaignGroup, e.chType, e.chSubType, e.optStatus, e.campId,
        e.labels, e.campName, e.targetCPA, e.targetROAS, e.cpcCeiling,
        e.rtbOptIn, e.primaryReasons, e.primaryStatus, e.servingStatus,
        e.status, e.urlOptOut])}
        FROM campaign
        ORDER BY campaign.name ASC`;

    queries.topProductsQuery = `
        SELECT ${joinFields([e.prodId, e.prodTitle, e.impr, e.clicks, e.cost, e.conv, e.value])}
        FROM shopping_performance_view 
        WHERE segments.date DURING LAST_7_DAYS 
        ORDER BY metrics.cost_micros DESC 
        LIMIT 50`;

    queries.matchTypesQuery = `
        SELECT ${joinFields([e.keywordMatchType, e.impr, e.clicks, e.cost, e.conv, e.value])}
        FROM keyword_view 
        WHERE segments.date DURING LAST_7_DAYS LIMIT 5`;

    queries.searchTermsQuery = `
        SELECT ${joinFields([e.searchTerm, e.impr, e.clicks, e.cost, e.conv, e.value])}
        FROM search_term_view 
        WHERE segments.date DURING LAST_7_DAYS 
        AND metrics.impressions > 0 ORDER BY metrics.cost_micros DESC LIMIT 5`;

    queries.channelTypeSpendQuery = `
        SELECT ${joinFields([e.chType, e.impr, e.cost, e.conv, e.value])}
        FROM campaign 
        WHERE segments.date DURING LAST_30_DAYS`;

    queries.pMaxSubChannelQuery = `
        SELECT ${joinFields([e.segDate, e.impr, e.cost, e.conv, e.value])}
        FROM campaign 
        WHERE segments.date DURING LAST_7_DAYS 
        AND campaign.advertising_channel_type = "PERFORMANCE_MAX"`;

    return queries;
}

function transformHeaders(data) {
    if (!data || data.length === 0) return data;
    
    // Create a mapping of transformed field names to their definitions
    const fieldMapping = {};
    Object.values(FIELD_DEFINITIONS).forEach(def => {
        fieldMapping[def.transformed] = def;
    });
    
    return data.map(row => {
        const transformedRow = {};
        
        // Process each field in the raw data
        Object.entries(row).forEach(([field, value]) => {
            const fieldDef = fieldMapping[field];
            if (fieldDef) {
                // Use the header name from field definition and apply transform if it exists
                const transformedValue = fieldDef.transform ? fieldDef.transform(value) : value;
                transformedRow[fieldDef.header] = transformedValue;
            }
        });
        
        return transformedRow;
    });
}

function flattenObject(obj) {
    const result = {};
    
    function recurse(current, property = '') {
        for (const key in current) {
            if (current.hasOwnProperty(key)) {
                const value = current[key];
                const newProperty = property ? `${property}.${key}` : key;
                
                if (value && typeof value === 'object') {
                    // Handle arrays by joining elements
                    if (Array.isArray(value)) {
                        result[newProperty] = value.join(', ');
                    } else {
                        recurse(value, newProperty);
                    }
                } else {
                    result[newProperty] = value;
                }
            }
        }
    }
    
    recurse(obj);
    return result;
}

function populateSheet(sheet, data) {
    if (!data?.length) return;
    
    const headers = Object.keys(data[0]);
    const values = [headers].concat(data.map(row => 
        headers.map(header => {
            const value = row[header];
            // Convert null/undefined to empty string and handle other special cases
            if (value === null || value === undefined) return '';
            if (Array.isArray(value)) return value.join(', ');
            return value;
        })
    ));
    
    sheet.getRange(1, 1, values.length, headers.length).setValues(values);
}

const FIELD_DEFINITIONS = {
    segHour: { query: ' segments.hour ', transformed: 'segments.hour', header: 'Hour' },
    segDate: { query: ' segments.date ', transformed: 'segments.date', header: 'Date' },
    campName: { query: ' campaign.name ', transformed: 'campaign.name', header: 'Campaign' },
    campId: { query: ' campaign.id ', transformed: 'campaign.id', header: 'CampaignId' },
    conv: { query: ' metrics.conversions ', transformed: 'metrics.conversions', header: 'Conversions' },
    clicks: { query: ' metrics.clicks ', transformed: 'metrics.clicks', header: 'Clicks' },
    cost: { query: ' metrics.cost_micros ', transformed: 'metrics.costMicros', header: 'Cost', transform: value => value / 1000000 },
    value: { query: ' metrics.conversions_value ', transformed: 'metrics.conversionsValue', header: 'ConvValue' },
    impr: { query: ' metrics.impressions ', transformed: 'metrics.impressions', header: 'Impressions' },
    searchBudgetLost: { query: ' metrics.search_budget_lost_impression_share ', transformed: 'metrics.searchBudgetLostImpressionShare', header: 'LostToBudget' },
    searchShare: { query: ' metrics.search_impression_share ', transformed: 'metrics.searchImpressionShare', header: 'ImprShare' },
    searchRankLost: { query: ' metrics.search_rank_lost_impression_share ', transformed: 'metrics.searchRankLostImpressionShare', header: 'LostToRank' },
    biddingStrategy: { query: ' campaign.bidding_strategy ', transformed: 'campaign.biddingStrategy', header: 'BidStrategy' },
    biddingStatus: { query: ' campaign.bidding_strategy_system_status ', transformed: 'campaign.biddingStrategySystemStatus', header: 'BidStatus' },
    biddingType: { query: ' campaign.bidding_strategy_type ', transformed: 'campaign.biddingStrategyType', header: 'BidType' },
    budget: { query: ' campaign.campaign_budget ', transformed: 'campaign.campaignBudget', header: 'Budget' },
    campaignGroup: { query: ' campaign.campaign_group ', transformed: 'campaign.campaignGroup', header: 'Group' },
    chType: { query: ' campaign.advertising_channel_type ', transformed: 'campaign.advertisingChannelType', header: 'Channel' },
    chSubType: { query: ' campaign.advertising_channel_sub_type ', transformed: 'campaign.advertisingChannelSubType', header: 'SubChannel' },
    optStatus: { query: ' campaign.ad_serving_optimization_status ', transformed: 'campaign.adServingOptimizationStatus', header: 'OptStatus' },
    labels: { query: ' campaign.labels ', transformed: 'campaign.labels', header: 'Labels' },
    targetCPA: { query: ' campaign.maximize_conversions.target_cpa_micros ', transformed: 'campaign.maximizeConversions.targetCpaMicros', header: 'TargetCPA', transform: value => value / 1000000 },
    targetROAS: { query: ' campaign.maximize_conversion_value.target_roas ', transformed: 'campaign.maximizeConversionValue.targetRoas', header: 'TargetROAS' },
    cpcCeiling: { query: ' campaign.percent_cpc.cpc_bid_ceiling_micros ', transformed: 'campaign.percentCpc.cpcBidCeilingMicros', header: 'MaxCPC', transform: value => value / 1000000 },
    rtbOptIn: { query: ' campaign.real_time_bidding_setting.opt_in ', transformed: 'campaign.realTimeBiddingSetting.optIn', header: 'RTBOptIn' },
    primaryReasons: { query: ' campaign.primary_status_reasons ', transformed: 'campaign.primaryStatusReasons', header: 'StatusReasons' },
    primaryStatus: { query: ' campaign.primary_status ', transformed: 'campaign.primaryStatus', header: 'PrimaryStatus' },
    servingStatus: { query: ' campaign.serving_status ', transformed: 'campaign.servingStatus', header: 'ServingStatus' },
    status: { query: ' campaign.status ', transformed: 'campaign.status', header: 'Status' },
    urlOptOut: { query: ' campaign.url_expansion_opt_out ', transformed: 'campaign.urlExpansionOptOut', header: 'OptOutURLExp' },
    allConv: { query: ' metrics.all_conversions ', transformed: 'metrics.allConversions', header: 'AllConversions' },
    allConvValue: { query: ' metrics.all_conversions_value ', transformed: 'metrics.allConversionsValue', header: 'AllConvValue' },
    convDate: { query: ' metrics.conversions_by_conversion_date ', transformed: 'metrics.conversionsByConversionDate', header: 'ConvByDate' },
    convValueDate: { query: ' metrics.conversions_value_by_conversion_date ', transformed: 'metrics.conversionsValueByConversionDate', header: 'ConvValueByDate' },
    avgCpc: { query: ' metrics.average_cpc ', transformed: 'metrics.averageCpc', header: 'AvgCPC' },
    views: { query: ' metrics.video_views ', transformed: 'metrics.videoViews', header: 'Views' },
    cpv: { query: ' metrics.average_cpv ', transformed: 'metrics.averageCpv', header: 'AvgCPV' },
    prodChannel: { query: ' segments.product_channel ', transformed: 'segments.productChannel', header: 'ProductChannel' },
    prodId: { query: ' segments.product_item_id ', transformed: 'segments.productItemId', header: 'ProductId' },
    prodTitle: { query: ' segments.product_title ', transformed: 'segments.productTitle', header: 'ProductTitle' },
    keywordText: { query: ' ad_group_criterion.keyword.text ', transformed: 'adGroupCriterion.keyword.text', header: 'KeywordText' },
    keywordMatchType: { query: ' ad_group_criterion.keyword.match_type ', transformed: 'adGroupCriterion.keyword.matchType', header: 'KeywordMatchType' },
    searchTerm: { query: ' search_term_view.search_term ', transformed: 'searchTermView.searchTerm', header: 'SearchTerm' },
    assetInteractionTarget: { query: ' segments.asset_interaction_target.asset ', transformed: 'segments.assetInteractionTarget.asset', header: 'AssetInteraction' },
    interactionOnAsset: { query: ' segments.asset_interaction_target.interaction_on_this_asset ', transformed: 'segments.assetInteractionTarget.interactionOnThisAsset', header: 'AssetInteractionCount' }
};

// thanks for using the script & the app!
