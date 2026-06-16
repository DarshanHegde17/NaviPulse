/** Indian railway stations by state — curated reference data for NaviPulse My Railway */
const STATION_NAMES = {
    NDLS: 'New Delhi', NZM: 'Hazrat Nizamuddin', CSTM: 'Mumbai CSMT', BCT: 'Mumbai Central',
    SBC: 'Bengaluru City', MAS: 'Chennai Central', HWH: 'Howrah', SDAH: 'Sealdah',
    SC: 'Secunderabad', PNBE: 'Patna Jn', CNBB: 'Bengaluru Cant', PUNE: 'Pune Jn',
    LKO: 'Lucknow NR', ADI: 'Ahmedabad', JP: 'Jaipur', BBS: 'Bhubaneswar',
    RNC: 'Ranchi', GHY: 'Guwahati', KOAA: 'Kolkata', YPR: 'Yesvantpur',
    MYS: 'Mysuru', CBE: 'Coimbatore', MDU: 'Madurai', TPJ: 'Tiruchirappalli',
    NGP: 'Nagpur', BPL: 'Bhopal', INDB: 'Indore', JAT: 'Jammu Tawi',
    ASR: 'Amritsar', VSKP: 'Visakhapatnam', BZA: 'Vijayawada', TPTY: 'Tirupati',
    AGTL: 'Agartala', DMR: 'Dimapur', SHM: 'Shalimar', KOAA: 'Kolkata',
};

const INDIAN_RAILWAY_BY_STATE = {
    'Andhra Pradesh': [
        { id: 'vskp', name: 'Visakhapatnam Jn', city: 'Visakhapatnam', code: 'VSKP', zone: 'ECoR', type: 'Junction', platforms: 8, dailyTrains: 95, crew: 1800, areaSqKm: 0.45, yearOpened: 1893 },
        { id: 'bza', name: 'Vijayawada Jn', city: 'Vijayawada', code: 'BZA', zone: 'SCR', type: 'Junction', platforms: 10, dailyTrains: 220, crew: 3200, areaSqKm: 0.62, yearOpened: 1889 },
        { id: 'tpty', name: 'Tirupati', city: 'Tirupati', code: 'TPTY', zone: 'SCR', type: 'Terminal', platforms: 5, dailyTrains: 48, crew: 680, areaSqKm: 0.22, yearOpened: 1891 },
    ],
    'Assam': [
        { id: 'ghy', name: 'Guwahati', city: 'Guwahati', code: 'GHY', zone: 'NFR', type: 'Junction', platforms: 7, dailyTrains: 85, crew: 1500, areaSqKm: 0.38, yearOpened: 1881 },
        { id: 'dbrg', name: 'Dibrugarh', city: 'Dibrugarh', code: 'DBRG', zone: 'NFR', type: 'Terminal', platforms: 4, dailyTrains: 32, crew: 520, areaSqKm: 0.18, yearOpened: 1882 },
    ],
    'Bihar': [
        { id: 'pnbe', name: 'Patna Jn', city: 'Patna', code: 'PNBE', zone: 'ECR', type: 'Junction', platforms: 10, dailyTrains: 120, crew: 2100, areaSqKm: 0.48, yearOpened: 1862 },
        { id: 'gaya', name: 'Gaya Jn', city: 'Gaya', code: 'GAYA', zone: 'ECR', type: 'Junction', platforms: 6, dailyTrains: 65, crew: 980, areaSqKm: 0.28, yearOpened: 1900 },
    ],
    'Delhi': [
        { id: 'ndls', name: 'New Delhi', city: 'New Delhi', code: 'NDLS', zone: 'NR', type: 'Terminal', platforms: 16, dailyTrains: 350, crew: 5200, areaSqKm: 0.85, yearOpened: 1926 },
        { id: 'nzm', name: 'Hazrat Nizamuddin', city: 'Delhi', code: 'NZM', zone: 'NR', type: 'Terminal', platforms: 7, dailyTrains: 145, crew: 2400, areaSqKm: 0.42, yearOpened: 1855 },
    ],
    'Gujarat': [
        { id: 'adi', name: 'Ahmedabad Jn', city: 'Ahmedabad', code: 'ADI', zone: 'WR', type: 'Junction', platforms: 12, dailyTrains: 165, crew: 2800, areaSqKm: 0.55, yearOpened: 1864 },
        { id: 'st', name: 'Surat', city: 'Surat', code: 'ST', zone: 'WR', type: 'Junction', platforms: 6, dailyTrains: 88, crew: 1200, areaSqKm: 0.32, yearOpened: 1860 },
        { id: 'bvc', name: 'Bhavnagar Terminus', city: 'Bhavnagar', code: 'BVC', zone: 'WR', type: 'Terminal', platforms: 3, dailyTrains: 22, crew: 380, areaSqKm: 0.15, yearOpened: 1880 },
    ],
    'Karnataka': [
        { id: 'sbc', name: 'KSR Bengaluru City', city: 'Bengaluru', code: 'SBC', zone: 'SWR', type: 'Junction', platforms: 10, dailyTrains: 185, crew: 3400, areaSqKm: 0.52, yearOpened: 1864 },
        { id: 'ypr', name: 'Yesvantpur Jn', city: 'Bengaluru', code: 'YPR', zone: 'SWR', type: 'Junction', platforms: 6, dailyTrains: 142, crew: 2600, areaSqKm: 0.38, yearOpened: 1892 },
        { id: 'cnbb', name: 'Bengaluru Cant', city: 'Bengaluru', code: 'BNC', zone: 'SWR', type: 'Terminal', platforms: 4, dailyTrains: 55, crew: 890, areaSqKm: 0.2, yearOpened: 1944 },
        { id: 'mys', name: 'Mysuru Jn', city: 'Mysuru', code: 'MYS', zone: 'SWR', type: 'Junction', platforms: 6, dailyTrains: 68, crew: 1100, areaSqKm: 0.28, yearOpened: 1882 },
        { id: 'ubl', name: 'Hubballi Jn', city: 'Hubballi', code: 'UBL', zone: 'SWR', type: 'Junction', platforms: 8, dailyTrains: 95, crew: 1450, areaSqKm: 0.35, yearOpened: 1886 },
    ],
    'Kerala': [
        { id: 'ers', name: 'Ernakulam Jn', city: 'Kochi', code: 'ERS', zone: 'SR', type: 'Junction', platforms: 6, dailyTrains: 78, crew: 1300, areaSqKm: 0.3, yearOpened: 1902 },
        { id: 'tvc', name: 'Thiruvananthapuram Central', city: 'Thiruvananthapuram', code: 'TVC', zone: 'SR', type: 'Terminal', platforms: 5, dailyTrains: 72, crew: 1250, areaSqKm: 0.25, yearOpened: 1931 },
        { id: 'clt', name: 'Kozhikode', city: 'Kozhikode', code: 'CLT', zone: 'SR', type: 'Junction', platforms: 4, dailyTrains: 48, crew: 820, areaSqKm: 0.2, yearOpened: 1901 },
    ],
    'Madhya Pradesh': [
        { id: 'bpl', name: 'Bhopal Jn', city: 'Bhopal', code: 'BPL', zone: 'WCR', type: 'Junction', platforms: 6, dailyTrains: 95, crew: 1400, areaSqKm: 0.32, yearOpened: 1884 },
        { id: 'indb', name: 'Indore Jn', city: 'Indore', code: 'INDB', zone: 'WR', type: 'Junction', platforms: 5, dailyTrains: 72, crew: 1100, areaSqKm: 0.28, yearOpened: 1875 },
        { id: 'jbp', name: 'Jabalpur', city: 'Jabalpur', code: 'JBP', zone: 'WCR', type: 'Junction', platforms: 6, dailyTrains: 65, crew: 980, areaSqKm: 0.26, yearOpened: 1867 },
    ],
    'Maharashtra': [
        { id: 'cstm', name: 'Mumbai CSMT', city: 'Mumbai', code: 'CSTM', zone: 'CR', type: 'Terminal', platforms: 18, dailyTrains: 280, crew: 4800, areaSqKm: 0.72, yearOpened: 1853 },
        { id: 'bct', name: 'Mumbai Central', city: 'Mumbai', code: 'BCT', zone: 'WR', type: 'Terminal', platforms: 9, dailyTrains: 165, crew: 2900, areaSqKm: 0.45, yearOpened: 1930 },
        { id: 'pune', name: 'Pune Jn', city: 'Pune', code: 'PUNE', zone: 'CR', type: 'Junction', platforms: 6, dailyTrains: 125, crew: 2200, areaSqKm: 0.38, yearOpened: 1858 },
        { id: 'ngp', name: 'Nagpur Jn', city: 'Nagpur', code: 'NGP', zone: 'CR', type: 'Junction', platforms: 8, dailyTrains: 195, crew: 3100, areaSqKm: 0.48, yearOpened: 1867 },
        { id: 'kalyan', name: 'Kalyan Jn', city: 'Kalyan', code: 'KYN', zone: 'CR', type: 'Junction', platforms: 8, dailyTrains: 420, crew: 1800, areaSqKm: 0.35, yearOpened: 1854 },
    ],
    'Odisha': [
        { id: 'bbs', name: 'Bhubaneswar', city: 'Bhubaneswar', code: 'BBS', zone: 'ECoR', type: 'Junction', platforms: 6, dailyTrains: 88, crew: 1400, areaSqKm: 0.3, yearOpened: 1896 },
    ],
    'Punjab': [
        { id: 'asr', name: 'Amritsar Jn', city: 'Amritsar', code: 'ASR', zone: 'NR', type: 'Junction', platforms: 6, dailyTrains: 72, crew: 1150, areaSqKm: 0.28, yearOpened: 1862 },
        { id: 'ldh', name: 'Ludhiana Jn', city: 'Ludhiana', code: 'LDH', zone: 'NR', type: 'Junction', platforms: 5, dailyTrains: 95, crew: 1300, areaSqKm: 0.32, yearOpened: 1862 },
    ],
    'Rajasthan': [
        { id: 'jp', name: 'Jaipur Jn', city: 'Jaipur', code: 'JP', zone: 'NWR', type: 'Junction', platforms: 7, dailyTrains: 105, crew: 1650, areaSqKm: 0.35, yearOpened: 1875 },
        { id: 'jod', name: 'Jodhpur Jn', city: 'Jodhpur', code: 'JU', zone: 'NWR', type: 'Junction', platforms: 5, dailyTrains: 48, crew: 780, areaSqKm: 0.22, yearOpened: 1885 },
        { id: 'udz', name: 'Udaipur City', city: 'Udaipur', code: 'UDZ', zone: 'NWR', type: 'Terminal', platforms: 4, dailyTrains: 32, crew: 520, areaSqKm: 0.18, yearOpened: 1890 },
    ],
    'Tamil Nadu': [
        { id: 'mas', name: 'Chennai Central', city: 'Chennai', code: 'MAS', zone: 'SR', type: 'Terminal', platforms: 12, dailyTrains: 245, crew: 4200, areaSqKm: 0.58, yearOpened: 1873 },
        { id: 'cbe', name: 'Coimbatore Jn', city: 'Coimbatore', code: 'CBE', zone: 'SR', type: 'Junction', platforms: 6, dailyTrains: 88, crew: 1350, areaSqKm: 0.3, yearOpened: 1872 },
        { id: 'mdu', name: 'Madurai Jn', city: 'Madurai', code: 'MDU', zone: 'SR', type: 'Junction', platforms: 5, dailyTrains: 65, crew: 980, areaSqKm: 0.26, yearOpened: 1875 },
        { id: 'tpj', name: 'Tiruchirappalli Jn', city: 'Tiruchirappalli', code: 'TPJ', zone: 'SR', type: 'Junction', platforms: 7, dailyTrains: 72, crew: 1100, areaSqKm: 0.28, yearOpened: 1862 },
    ],
    'Telangana': [
        { id: 'sc', name: 'Secunderabad Jn', city: 'Hyderabad', code: 'SC', zone: 'SCR', type: 'Junction', platforms: 10, dailyTrains: 195, crew: 3200, areaSqKm: 0.48, yearOpened: 1874 },
        { id: 'kcg', name: 'Kacheguda', city: 'Hyderabad', code: 'KCG', zone: 'SCR', type: 'Terminal', platforms: 5, dailyTrains: 68, crew: 1050, areaSqKm: 0.24, yearOpened: 1916 },
    ],
    'Uttar Pradesh': [
        { id: 'lko', name: 'Lucknow NR', city: 'Lucknow', code: 'LKO', zone: 'NR', type: 'Junction', platforms: 8, dailyTrains: 125, crew: 2100, areaSqKm: 0.42, yearOpened: 1867 },
        { id: 'bsb', name: 'Varanasi Jn', city: 'Varanasi', code: 'BSB', zone: 'NER', type: 'Junction', platforms: 9, dailyTrains: 145, crew: 2400, areaSqKm: 0.45, yearOpened: 1862 },
        { id: 'cnb', name: 'Kanpur Central', city: 'Kanpur', code: 'CNB', zone: 'NCR', type: 'Junction', platforms: 10, dailyTrains: 285, crew: 3800, areaSqKm: 0.55, yearOpened: 1859 },
        { id: 'agc', name: 'Agra Cantt', city: 'Agra', code: 'AGC', zone: 'NCR', type: 'Junction', platforms: 6, dailyTrains: 95, crew: 1400, areaSqKm: 0.3, yearOpened: 1904 },
    ],
    'West Bengal': [
        { id: 'hwh', name: 'Howrah Jn', city: 'Kolkata', code: 'HWH', zone: 'ER', type: 'Terminal', platforms: 23, dailyTrains: 320, crew: 5500, areaSqKm: 0.95, yearOpened: 1854 },
        { id: 'sdah', name: 'Sealdah', city: 'Kolkata', code: 'SDAH', zone: 'ER', type: 'Terminal', platforms: 14, dailyTrains: 280, crew: 4800, areaSqKm: 0.68, yearOpened: 1869 },
        { id: 'njp', name: 'New Jalpaiguri', city: 'Siliguri', code: 'NJP', zone: 'NFR', type: 'Junction', platforms: 6, dailyTrains: 88, crew: 1350, areaSqKm: 0.32, yearOpened: 1960 },
    ],
    'Jharkhand': [
        { id: 'rnc', name: 'Ranchi', city: 'Ranchi', code: 'RNC', zone: 'SER', type: 'Junction', platforms: 5, dailyTrains: 48, crew: 780, areaSqKm: 0.22, yearOpened: 1907 },
    ],
    'Jammu and Kashmir': [
        { id: 'jat', name: 'Jammu Tawi', city: 'Jammu', code: 'JAT', zone: 'NR', type: 'Junction', platforms: 7, dailyTrains: 65, crew: 1100, areaSqKm: 0.28, yearOpened: 1925 },
    ],
    'Chhattisgarh': [
        { id: 'r', name: 'Raipur Jn', city: 'Raipur', code: 'R', zone: 'SECR', type: 'Junction', platforms: 6, dailyTrains: 72, crew: 1150, areaSqKm: 0.26, yearOpened: 1888 },
    ],
    'Tripura': [
        { id: 'agtl', name: 'Agartala', city: 'Agartala', code: 'AGTL', zone: 'NFR', type: 'Terminal', platforms: 3, dailyTrains: 18, crew: 320, areaSqKm: 0.12, yearOpened: 2008 },
    ],
};

const RAILWAY_HUBS = ['NDLS', 'CSTM', 'BCT', 'SBC', 'MAS', 'HWH', 'SC', 'PNBE', 'PUNE', 'ADI', 'CNB'];

const TRAIN_TYPES = ['Rajdhani Express', 'Shatabdi Express', 'Vande Bharat', 'Superfast', 'Mail/Express'];

/** Curated stats for major stations — merged over API dataset when available */
const CURATED_STATIONS = (() => {
    const map = {};
    for (const [stateName, stations] of Object.entries(INDIAN_RAILWAY_BY_STATE)) {
        for (const st of stations) {
            map[st.code] = { ...st, stateName };
        }
    }
    return map;
})();

function enrichStation(station) {
    if (!station) return null;
    const curated = CURATED_STATIONS[station.code];
    if (!curated) return station;
    return {
        ...station,
        ...curated,
        state: station.state || curated.stateName,
        city: curated.city || station.city,
        name: curated.name || station.name,
    };
}
