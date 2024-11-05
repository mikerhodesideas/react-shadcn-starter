// Global constants
const TEMPLATE_URL = 'https://docs.google.com/spreadsheets/d/1VynLYz0q-tYa9fpXhdWTUnBIdCGmBrgMkRz1rD6EhC0/edit?gid=0#gid=0';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1XmQYHWYbQbtn6mnrGYB71dsixbp66Eo3n5o7fka_s10/edit?gid=1035127487#gid=1035127487'; // Add your sheet URL here if you want to use an existing sheet
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Timing utility functions
function startTimer() {
    return new Date().getTime();
}

function endTimer(startTime, operation) {
    const endTime = new Date().getTime();
    const duration = (endTime - startTime) / 1000; // Convert to seconds
    Logger.log(`⏱️ ${operation} took ${duration.toFixed(2)} seconds`);
    return duration;
}

function main() {
    try {
        const scriptStartTime = startTimer();
        Logger.log('Starting enhanced campaign data export script');
        
        // Get or create spreadsheet
        const spreadsheet = getOrCreateSpreadsheet();
        
        let elements = defineElements({});
        let queries = buildQueries(elements, 100);

        // Define datasets with name and query mapping
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
            { name: 'pmax', query: queries.pMaxSubChannelQuery }
        ];

        // Process each dataset with retries and timing
        for (const { name, query } of datasets) {
            const sheetStartTime = startTimer();
            let success = false;
            let retryCount = 0;
            
            while (!success && retryCount < MAX_RETRIES) {
                try {
                    const data = fetchData(query);
                    if (data && data.length > 0) {
                        // Get or create sheet with retries
                        let sheet = getOrCreateSheet(spreadsheet, name);
                        if (!sheet) {
                            throw new Error('Failed to create/access sheet');
                        }
                        
                        // Clear existing content
                        sheet.clear();
                        
                        // Populate data
                        populateSheet(sheet, data);
                        const sheetDuration = endTimer(sheetStartTime, `Sheet ${name}`);
                        success = true;
                    } else {
                        Logger.log(`No data available for ${name}`);
                        success = true; // Consider no data as success to avoid retries
                    }
                } catch (error) {
                    retryCount++;
                    if (retryCount === MAX_RETRIES) {
                        Logger.log(`Error processing ${name} after ${MAX_RETRIES} attempts: ${error.message}`);
                    } else {
                        Logger.log(`Retry ${retryCount} for ${name}: ${error.message}`);
                        Utilities.sleep(RETRY_DELAY * retryCount); // Exponential backoff
                    }
                }
            }
        }

        // Set sharing permissions if it's a new sheet
        if (!SHEET_URL) {
            DriveApp.getFileById(spreadsheet.getId())
                .setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        }
        
        Logger.log(`Spreadsheet available at: ${spreadsheet.getUrl()}`);
        const totalDuration = endTimer(scriptStartTime, 'Total script execution');
        Logger.log('Script completed successfully');

    } catch (error) {
        Logger.log(`Script failed with error: ${error.message}`);
        Logger.log(`Stack trace: ${error.stack}`);
    }
}

function getOrCreateSheet(spreadsheet, name) {
    let sheet = spreadsheet.getSheetByName(name);
    let retryCount = 0;
    
    while (!sheet && retryCount < MAX_RETRIES) {
        try {
            if (!sheet) {
                sheet = spreadsheet.insertSheet(name);
            }
            return sheet;
        } catch (error) {
            retryCount++;
            if (retryCount === MAX_RETRIES) {
                Logger.log(`Failed to create sheet ${name} after ${MAX_RETRIES} attempts`);
                return null;
            }
            Utilities.sleep(RETRY_DELAY * retryCount);
        }
    }
    return sheet;
}

function getOrCreateSpreadsheet() {
    let retryCount = 0;
    while (retryCount < MAX_RETRIES) {
        try {
            if (SHEET_URL && SHEET_URL.length > 0) {
                return SpreadsheetApp.openByUrl(SHEET_URL);
            } else {
                const templateId = TEMPLATE_URL.match(/[-\w]{25,}/);
                if (!templateId) {
                    throw new Error('Invalid template URL');
                }
                const template = DriveApp.getFileById(templateId[0]);
                const copy = template.makeCopy('Google Ads Data ' + new Date().toISOString().split('T')[0]);
                return SpreadsheetApp.open(copy);
            }
        } catch (error) {
            retryCount++;
            if (retryCount === MAX_RETRIES) {
                throw new Error(`Failed to access/create spreadsheet after ${MAX_RETRIES} attempts: ${error.message}`);
            }
            Utilities.sleep(RETRY_DELAY * retryCount);
        }
    }
}

function populateSheet(sheet, data) {
    if (!data || data.length === 0) return;
    
    const populateStartTime = startTimer();
    const headers = Object.keys(data[0]);
    
    try {
        // Combine headers and data into single array
        const values = [headers].concat(
            data.map(row => headers.map(header => row[header]))
        );
        sheet.getRange(1, 1, values.length, headers.length).setValues(values);
        
        endTimer(populateStartTime, `Populated sheet with ${values.length} rows`);
    } catch (error) {
        throw new Error(`Error populating sheet: ${error.message}`);
    }
}

function buildQueries(e, numberOfDays) {
    let queries = {};

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
        WHERE ${prepareDateRange(numberOfDays)}
        ORDER BY segments.date DESC`;

    // New 30 days query without date segmentation
    queries.thirtyDaysQuery = `
        SELECT ${[e.campName, e.campId, e.conv, e.clicks, e.cost,
        e.value, e.impr, e.searchBudgetLost, e.searchShare, e.searchRankLost].join(',')}
        FROM campaign 
        WHERE segments.date DURING LAST_30_DAYS
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

function defineElements(s) {
    return {
        segHour: ' segments.hour ',
        segDate: ' segments.date ',
        campName: ' campaign.name ',
        campId: ' campaign.id ',
        conv: ' metrics.conversions ',
        clicks: ' metrics.clicks ',
        cost: ' metrics.cost_micros ',
        value: ' metrics.conversions_value ',
        impr: ' metrics.impressions ',
        searchBudgetLost: ' metrics.search_budget_lost_impression_share ',
        searchShare: ' metrics.search_impression_share ',
        searchRankLost: ' metrics.search_rank_lost_impression_share ',
        biddingStrategy: ' campaign.bidding_strategy ',
        biddingStatus: ' campaign.bidding_strategy_system_status ',
        biddingType: ' campaign.bidding_strategy_type ',
        budget: ' campaign.campaign_budget ',
        campaignGroup: ' campaign.campaign_group ',
        chType: ' campaign.advertising_channel_type ',
        chSubType: ' campaign.advertising_channel_sub_type ',
        optStatus: ' campaign.ad_serving_optimization_status ',
        labels: ' campaign.labels ',
        targetCPA: ' campaign.maximize_conversions.target_cpa_micros ',
        targetROAS: ' campaign.maximize_conversion_value.target_roas ',
        cpcCeiling: ' campaign.percent_cpc.cpc_bid_ceiling_micros ',
        rtbOptIn: ' campaign.real_time_bidding_setting.opt_in ',
        primaryReasons: ' campaign.primary_status_reasons ',
        primaryStatus: ' campaign.primary_status ',
        servingStatus: ' campaign.serving_status ',
        status: ' campaign.status ',
        urlOptOut: ' campaign.url_expansion_opt_out ',
        allConv: ' metrics.all_conversions ',
        allConvValue: ' metrics.all_conversions_value ',
        convDate: ' metrics.conversions_by_conversion_date ',
        convValueDate: ' metrics.conversions_value_by_conversion_date ',
        avgCpc: ' metrics.average_cpc ',
        views: ' metrics.video_views ',
        cpv: ' metrics.average_cpv ',
        prodChannel: ' segments.product_channel ',
        prodId: ' segments.product_item_id ',
        prodTitle: ' segments.product_title ',
        keywordText: ' ad_group_criterion.keyword.text ',
        keywordMatchType: ' ad_group_criterion.keyword.match_type ',
        searchTerm: ' search_term_view.search_term ',
        assetInteractionTarget: ' segments.asset_interaction_target.asset ',
        interactionOnAsset: ' segments.asset_interaction_target.interaction_on_this_asset '
    };
}

function prepareDateRange(numberOfDays) {
    let timezone = AdsApp.currentAccount().getTimeZone();
    let today = new Date(), yesterday = new Date(), startDate = new Date();
    yesterday.setDate(today.getDate() - 1);
    startDate.setDate(today.getDate() - numberOfDays);

    let fYesterday = Utilities.formatDate(yesterday, timezone, 'yyyy-MM-dd');
    let fStartDate = Utilities.formatDate(startDate, timezone, 'yyyy-MM-dd');
    let mainDateRange = `segments.date BETWEEN "${fStartDate}" AND "${fYesterday}"`;

    return mainDateRange;
}

function formatDateLiteral(dateString) {
    // Use a regular expression to extract date parts & regex to rearange them
    let dateParts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!dateParts) {
        throw new Error('Date format is not valid. Expected format dd/mm/yyyy.');
    }
    let formattedDate = `${dateParts[3]}-${dateParts[2]}-${dateParts[1]}`;
    return formattedDate;
}

function flattenObject(ob) {
    let toReturn = {};
    let stack = [{ obj: ob, prefix: '' }];

    while (stack.length > 0) {
        let { obj, prefix } = stack.pop();
        for (let i in obj) {
            if (obj.hasOwnProperty(i)) {
                let key = prefix ? prefix + '.' + i : i;
                if (typeof obj[i] === 'object' && obj[i] !== null) {
                    stack.push({ obj: obj[i], prefix: key });
                } else {
                    toReturn[key] = obj[i];
                }
            }
        }
    }

    return toReturn;
}

function getHeaderMapping() {
    return {
        // Hourly and Daily Metrics
        'segments.hour': 'Hour',
        'segments.date': 'Date',
        'campaign.name': 'Campaign',
        'campaign.id': 'CampaignId',
        'metrics.conversions': 'Conversions',
        'metrics.clicks': 'Clicks',
        'metrics.costMicros': 'Cost',
        'metrics.conversionsValue': 'ConvValue',
        'metrics.impressions': 'Impressions',
        'metrics.searchBudgetLostImpressionShare': 'LostToBudget',
        'metrics.searchImpressionShare': 'ImprShare',
        'metrics.searchRankLostImpressionShare': 'LostToRank',

        // Campaign Settings
        'campaign.biddingStrategy': 'BidStrategy',
        'campaign.biddingStrategySystemStatus': 'BidStatus',
        'campaign.biddingStrategyType': 'BidType',
        'campaign.campaignBudget': 'Budget',
        'campaign.campaignGroup': 'Group',
        'campaign.advertisingChannelType': 'Channel',
        'campaign.advertisingChannelSubType': 'SubChannel',
        'campaign.adServingOptimizationStatus': 'OptStatus',
        'campaign.labels': 'Labels',
        'campaign.maximizeConversions.targetCpaMicros': 'TargetCPA',
        'campaign.maximizeConversionValue.targetRoas': 'TargetROAS',
        'campaign.percentCpc.cpcBidCeilingMicros': 'MaxCPC',
        'campaign.realTimeBiddingSetting.optIn': 'RTBOptIn',
        'campaign.primaryStatusReasons': 'StatusReasons',
        'campaign.primaryStatus': 'PrimaryStatus',
        'campaign.servingStatus': 'ServingStatus',
        'campaign.status': 'Status',
        'campaign.urlExpansionOptOut': 'OptOutURLExp'
    };
}

function transformHeaders(data) {
    if (!data || data.length === 0) return data;
    
    const headerMapping = getHeaderMapping();
    return data.map(row => {
        const transformedRow = {};
        Object.entries(row).forEach(([key, value]) => {
            // Convert cost from micros to actual currency
            if (key === 'metrics.costMicros') {
                value = value / 1000000;
            }
            // Convert target CPA from micros to actual currency
            if (key === 'campaign.maximizeConversions.targetCpaMicros') {
                value = value / 1000000;
            }
            // Convert max CPC from micros to actual currency
            if (key === 'campaign.percentCpc.cpcBidCeilingMicros') {
                value = value / 1000000;
            }
            
            const newKey = headerMapping[key] || key;
            transformedRow[newKey] = value;
        });
        return transformedRow;
    });
}

function fetchData(q) {
    try {
        let data = [];
        let iterator = AdsApp.search(q, { 'apiVersion': 'v18' });
        while (iterator.hasNext()) {
            let row = iterator.next();
            data.push(flattenObject(row));
        }
        return transformHeaders(data);
    } catch (error) {
        Logger.log(`Error fetching data for query: ${q}`);
        Logger.log(`Error message: ${error.message}`);
        return null;
    }
}
