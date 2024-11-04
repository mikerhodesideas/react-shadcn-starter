// profit curve script

const FOLDER_ID = '1In-JbYLAim0OoCrQw0uvvHTtBofTNROk'; // Your folder ID

const CSV_FILES = {
    hourly_today: 'hourly_metrics_today.csv',
    hourly_yesterday: 'hourly_metrics_yesterday.csv',
    daily: 'daily_metrics.csv',
    settings: 'campaign_settings.csv',
    fileIndex: 'list.csv',
    // New files from Black Friday script
    top_products: 'top_products.csv',
    match_types: 'match_types.csv',
    search_terms: 'search_terms.csv',
    channel_spend: 'channel_spend.csv',
    pmax_subchannel: 'pmax_subchannel.csv'
};

function main() {
    try {
        Logger.log('Starting enhanced campaign data export script');
        const folder = DriveApp.getFolderById(FOLDER_ID);
        cleanFolder(folder);

        let fileIds = {};
        let elements = defineElements({});
        let queries = buildQueries(elements, {}, null);  // Remove createDateRanges

        // Original profit curve data fetching
        Logger.log('Fetching original metrics...');
        let hourlyTodayData = fetchData(queries.hourlyTodayQuery);
        let hourlyYesterdayData = fetchData(queries.hourlyYesterdayQuery);
        let dailyData = fetchData(queries.dailyMetricsQuery);
        let settingsData = fetchData(queries.campaignSettingsQuery);

        // Black Friday additional data fetching
        Logger.log('Fetching Black Friday metrics...');
        let topProductsData = fetchData(queries.topProductsQuery);
        let matchTypesData = fetchData(queries.matchTypesQuery);
        let searchTermsData = fetchData(queries.searchTermsQuery);
        let channelSpendData = fetchData(queries.channelTypeSpendQuery);
        let pMaxSubChannelData = fetchData(queries.pMaxSubChannelQuery);

        // Write all data to CSV files
        const datasets = [
            // Original datasets
            { name: 'hourly_today', data: hourlyTodayData },
            { name: 'hourly_yesterday', data: hourlyYesterdayData },
            { name: 'daily', data: dailyData },
            { name: 'settings', data: settingsData },
            // New datasets
            { name: 'top_products', data: topProductsData },
            { name: 'match_types', data: matchTypesData },
            { name: 'search_terms', data: searchTermsData },
            { name: 'channel_spend', data: channelSpendData },
            { name: 'pmax_subchannel', data: pMaxSubChannelData }
        ];

        datasets.forEach(({ name, data }) => {
            if (data && data.length > 0) {
                try {
                    const csvContent = convertToCsv(data);
                    const file = folder.createFile(CSV_FILES[name], csvContent, MimeType.CSV);
                    fileIds[name] = file.getId();
                    Logger.log(`Successfully created ${CSV_FILES[name]}`);
                } catch (error) {
                    Logger.log(`Error creating ${name} CSV: ${error.message}`);
                }
            } else {
                Logger.log(`No data available for ${name}`);
            }
        });

        createFileIndex(folder, fileIds);
        Logger.log('Script completed successfully');

    } catch (error) {
        Logger.log(`Script failed with error: ${error.message}`);
        Logger.log(`Stack trace: ${error.stack}`);
    }
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

function buildQueries(e, s, date) {
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
        WHERE segments.date DURING LAST_30_DAYS
        ORDER BY segments.date DESC`;

    queries.campaignSettingsQuery = `
        SELECT ${[e.biddingStrategy, e.biddingStatus, e.biddingType, e.budget,
        e.campaignGroup, e.chType, e.chSubType, e.optStatus, e.campId,
        e.labels, e.campName, e.targetCPA, e.targetROAS, e.cpcCeiling,
        e.rtbOptIn, e.primaryReasons, e.primaryStatus, e.servingStatus,
        e.status, e.urlOptOut].join(',')}
        FROM campaign
            ORDER BY campaign.name ASC`

    queries.topProductsQuery = `
        SELECT ${[e.prodId, e.prodTitle, e.impr, e.clicks, e.cost, e.conv, e.value].join(',')}
        FROM shopping_performance_view 
        WHERE segments.date DURING LAST_30_DAYS 
        ORDER BY metrics.cost_micros DESC 
        LIMIT 500`;

    queries.matchTypesQuery = `
        SELECT ${[e.keywordMatchType, e.impr, e.clicks, e.cost, e.conv, e.value].join(',')}
        FROM keyword_view 
        WHERE segments.date DURING LAST_30_DAYS`;

    queries.searchTermsQuery = `
        SELECT ${[e.searchTerm, e.impr, e.clicks, e.cost, e.conv, e.value].join(',')}
        FROM search_term_view 
        WHERE segments.date DURING LAST_30_DAYS 
        AND metrics.impressions > 0`;

    queries.channelTypeSpendQuery = `
        SELECT ${[e.chType, e.impr, e.cost, e.conv, e.value].join(',')}
        FROM campaign 
        WHERE segments.date DURING LAST_30_DAYS`;

    queries.pMaxSubChannelQuery = `
        SELECT ${[e.segDate, e.impr, e.cost, e.conv, e.value].join(',')}
        FROM campaign 
        WHERE segments.date DURING LAST_30_DAYS 
        AND campaign.advertising_channel_type = "PERFORMANCE_MAX"`;

    return queries;
}

function cleanFolder(folder) {
    const files = folder.getFiles();
    while (files.hasNext()) {
        const file = files.next();
        file.setTrashed(true);
    }
    Logger.log('Cleaned existing files from folder');
}

function convertToCsv(data) {
    if (!Array.isArray(data) || data.length === 0) return '';

    // If data is array of arrays, convert directly
    if (Array.isArray(data[0])) {
        return data.map(row =>
            row.map(cell => formatCellForCsv(cell)).join(',')
        ).join('\n');
    }

    // If data is array of objects, extract headers first
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
        headers.map(header => formatCellForCsv(row[header]))
    );

    return [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
}

function formatCellForCsv(cell) {
    if (cell === null || cell === undefined) return '';

    const cellStr = String(cell);
    // Escape quotes and wrap in quotes if contains comma or newline
    if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
    }
    return cellStr;
}

function createFileIndex(folder, fileIds) {
    // Create content with both file_id and file_name columns
    const indexContent = Object.entries(fileIds)
        .map(([key, id]) => `${id},${CSV_FILES[key]}`)
        .join('\n');

    const headerRow = 'file_id,file_name\n';
    const file = folder.createFile(
        CSV_FILES.fileIndex,
        headerRow + indexContent,
        MimeType.CSV
    );

    const fileUrl = `https://drive.google.com/file/d/${file.getId()}/view?usp=drive_link`;
    Logger.log(`File list (list.csv) available at: ${fileUrl}`);
}

function prepareDateRange(s) {
    // Check if fromDate and toDate are defined before using them
    let dateSwitch = s.fromDate !== undefined && s.toDate !== undefined ? 1 : 0;
    let today = new Date(), yesterday = new Date(), startDate = new Date();
    yesterday.setDate(today.getDate() - 1);
    startDate.setDate(today.getDate() - s.numberOfDays);
    // format the dates to be used in the queries
    let fYesterday = Utilities.formatDate(yesterday, s.timezone, 'yyyy-MM-dd');
    let fStartDate = Utilities.formatDate(startDate, s.timezone, 'yyyy-MM-dd');
    let fFromDate = dateSwitch ? formatDateLiteral(s.fromDate) : undefined;
    let fToDate = dateSwitch ? formatDateLiteral(s.toDate) : undefined;
    // set range for the queries - if switch is 1 use the from/to dates
    let mainDateRange = dateSwitch ? `segments.date BETWEEN "${fFromDate}" AND "${fToDate}"` : `segments.date BETWEEN "${fStartDate}" AND "${fYesterday}"`;

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
