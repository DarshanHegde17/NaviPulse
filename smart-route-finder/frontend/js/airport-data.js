/** Indian airports grouped by state/UT — curated public reference data for NaviPulse My Airport */
const IATA_NAMES = {
    DEL: 'Indira Gandhi Intl, Delhi', BOM: 'Chhatrapati Shivaji Intl, Mumbai',
    BLR: 'Kempegowda Intl, Bengaluru', HYD: 'Rajiv Gandhi Intl, Hyderabad',
    MAA: 'Chennai Intl', CCU: 'Netaji Subhas Chandra Bose Intl, Kolkata',
    GOI: 'Manohar Intl, Goa', COK: 'Cochin Intl', TRV: 'Trivandrum Intl',
    CCJ: 'Calicut Intl', AMD: 'Sardar Vallabhbhai Patel, Ahmedabad',
    PNQ: 'Pune Intl', NAG: 'Dr. Babasaheb Ambedkar, Nagpur',
    JAI: 'Jaipur Intl', LKO: 'Chaudhary Charan Singh, Lucknow',
    VNS: 'Lal Bahadur Shastri, Varanasi', PAT: 'Jay Prakash Narayan, Patna',
    GAU: 'Lokpriya Gopinath Bordoloi, Guwahati', IXR: 'Birsa Munda, Ranchi',
    BBI: 'Biju Patnaik, Bhubaneswar', IXC: 'Chandigarh Intl',
    SXR: 'Sheikh ul-Alam, Srinagar', IXL: 'Kushok Bakula Rimpochee, Leh',
    IXB: 'Bagdogra', IXZ: 'Veer Savarkar, Port Blair', ATQ: 'Sri Guru Ram Dass Jee, Amritsar',
    IXE: 'Mangalore Intl', HBX: 'Hubballi', MYQ: 'Mysuru', BDQ: 'Vadodara',
    STV: 'Surat', RAJ: 'Rajkot', BHO: 'Raja Bhoj, Bhopal', IDR: 'Devi Ahilya Bai Holkar, Indore',
    JLR: 'Jabalpur', GWL: 'Gwalior', IXU: 'Aurangabad', NDC: 'Nashik',
    VTZ: 'Visakhapatnam', VGA: 'Vijayawada', TIR: 'Tirupati', RJA: 'Rajahmundry',
    IXL: 'Leh', DIB: 'Dibrugarh', JRH: 'Rowriah, Jorhat', IXS: 'Silchar',
    GAY: 'Gaya', RPR: 'Swami Vivekananda, Raipur', JGA: 'Jagdalpur',
    GOX: 'Manohar Intl, Mopa', SHL: 'Shillong', AJL: 'Lengpui, Aizawl',
    DMU: 'Dimapur', IXA: 'Maharaja Bir Bikram, Agartala', IMF: 'Imphal',
    PGH: 'Pantnagar', DED: 'Jolly Grant, Dehradun', JSA: 'Jaisalmer',
    JDH: 'Jodhpur', UDR: 'Maharana Pratap, Udaipur', CNN: 'Kannur Intl',
    SXV: 'Salem', TRZ: 'Tiruchirappalli', IXM: 'Madurai', CJB: 'Coimbatore Intl',
    KNU: 'Kanpur', AGR: 'Agra', GOP: 'Gorakhpur', IXD: 'Prayagraj',
    JRG: 'Jamshedpur', PGY: 'Pakyong', AYJ: 'Maharishi Valmiki Intl, Ayodhya',
    HSR: 'Hisar', JAI: 'Jaipur', LUH: 'Ludhiana', BUP: 'Bathinda',
};

const INDIAN_AIRPORTS_BY_STATE = {
    'Andhra Pradesh': [
        { id: 'vtz', name: 'Visakhapatnam Airport', city: 'Visakhapatnam', iata: 'VTZ', icao: 'VOVZ', type: 'Domestic', areaAcres: 350, areaSqKm: 1.4, crew: 420, dailyFlights: 48, runways: 1, terminals: 1, elevation: '15 ft', operator: 'AAI', yearOpened: 1981 },
        { id: 'vga', name: 'Vijayawada Airport', city: 'Vijayawada', iata: 'VGA', icao: 'VOBZ', type: 'Domestic', areaAcres: 500, areaSqKm: 2.0, crew: 380, dailyFlights: 42, runways: 1, terminals: 1, elevation: '82 ft', operator: 'AAI', yearOpened: 1950 },
        { id: 'tir', name: 'Tirupati Airport', city: 'Tirupati', iata: 'TIR', icao: 'VOTP', type: 'Domestic', areaAcres: 280, areaSqKm: 1.1, crew: 290, dailyFlights: 28, runways: 1, terminals: 1, elevation: '350 ft', operator: 'AAI', yearOpened: 1976 },
        { id: 'rja', name: 'Rajahmundry Airport', city: 'Rajahmundry', iata: 'RJA', icao: 'VORY', type: 'Domestic', areaAcres: 210, areaSqKm: 0.85, crew: 180, dailyFlights: 14, runways: 1, terminals: 1, elevation: '151 ft', operator: 'AAI', yearOpened: 1983 },
    ],
    'Arunachal Pradesh': [
        { id: 'hol', name: 'Hollongi Airport', city: 'Itanagar', iata: 'HGI', icao: 'VEHO', type: 'Domestic', areaAcres: 410, areaSqKm: 1.7, crew: 220, dailyFlights: 8, runways: 1, terminals: 1, elevation: '600 ft', operator: 'AAI', yearOpened: 2022 },
        { id: 'ixt', name: 'Pasighat Airport', city: 'Pasighat', iata: 'IXT', icao: 'VEPG', type: 'Domestic', areaAcres: 120, areaSqKm: 0.5, crew: 95, dailyFlights: 4, runways: 1, terminals: 1, elevation: '477 ft', operator: 'AAI', yearOpened: 2018 },
    ],
    'Assam': [
        { id: 'gau', name: 'Lokpriya Gopinath Bordoloi Intl Airport', city: 'Guwahati', iata: 'GAU', icao: 'VEGT', type: 'International', areaAcres: 1100, areaSqKm: 4.5, crew: 2100, dailyFlights: 95, runways: 1, terminals: 2, elevation: '162 ft', operator: 'AAI', yearOpened: 1958 },
        { id: 'dib', name: 'Dibrugarh Airport', city: 'Dibrugarh', iata: 'DIB', icao: 'VEMN', type: 'Domestic', areaAcres: 380, areaSqKm: 1.5, crew: 340, dailyFlights: 22, runways: 1, terminals: 1, elevation: '362 ft', operator: 'AAI', yearOpened: 1950 },
        { id: 'jrh', name: 'Jorhat Airport', city: 'Jorhat', iata: 'JRH', icao: 'VEJT', type: 'Domestic', areaAcres: 290, areaSqKm: 1.2, crew: 260, dailyFlights: 16, runways: 1, terminals: 1, elevation: '311 ft', operator: 'AAI', yearOpened: 1943 },
        { id: 'ixs', name: 'Silchar Airport', city: 'Silchar', iata: 'IXS', icao: 'VEKU', type: 'Domestic', areaAcres: 320, areaSqKm: 1.3, crew: 280, dailyFlights: 18, runways: 1, terminals: 1, elevation: '352 ft', operator: 'AAI', yearOpened: 1944 },
    ],
    'Bihar': [
        { id: 'pat', name: 'Jay Prakash Narayan Airport', city: 'Patna', iata: 'PAT', icao: 'VEPT', type: 'Domestic', areaAcres: 254, areaSqKm: 1.0, crew: 520, dailyFlights: 52, runways: 1, terminals: 1, elevation: '170 ft', operator: 'AAI', yearOpened: 1973 },
        { id: 'gay', name: 'Gaya Airport', city: 'Gaya', iata: 'GAY', icao: 'VEGY', type: 'International', areaAcres: 350, areaSqKm: 1.4, crew: 310, dailyFlights: 12, runways: 1, terminals: 1, elevation: '380 ft', operator: 'AAI', yearOpened: 1972 },
    ],
    'Chhattisgarh': [
        { id: 'rpr', name: 'Swami Vivekananda Airport', city: 'Raipur', iata: 'RPR', icao: 'VERP', type: 'Domestic', areaAcres: 700, areaSqKm: 2.8, crew: 480, dailyFlights: 38, runways: 1, terminals: 1, elevation: '1045 ft', operator: 'AAI', yearOpened: 1975 },
        { id: 'jga', name: 'Jagdalpur Airport', city: 'Jagdalpur', iata: 'JGB', icao: 'VEJR', type: 'Domestic', areaAcres: 180, areaSqKm: 0.7, crew: 120, dailyFlights: 6, runways: 1, terminals: 1, elevation: '1812 ft', operator: 'State Govt', yearOpened: 2019 },
    ],
    'Delhi': [
        { id: 'del', name: 'Indira Gandhi International Airport', city: 'New Delhi', iata: 'DEL', icao: 'VIDP', type: 'International', areaAcres: 5106, areaSqKm: 20.7, crew: 18500, dailyFlights: 1450, runways: 3, terminals: 3, elevation: '777 ft', operator: 'DIAL', yearOpened: 1962 },
    ],
    'Goa': [
        { id: 'goi', name: 'Manohar International Airport (Mopa)', city: 'Mopa', iata: 'GOX', icao: 'VOGA', type: 'International', areaAcres: 1550, areaSqKm: 6.3, crew: 1800, dailyFlights: 85, runways: 1, terminals: 1, elevation: '175 ft', operator: 'GOXIAL', yearOpened: 2023 },
        { id: 'goa-dab', name: 'Dabolim Airport', city: 'Vasco da Gama', iata: 'GOI', icao: 'VOGO', type: 'International', areaAcres: 688, areaSqKm: 2.8, crew: 1200, dailyFlights: 62, runways: 1, terminals: 1, elevation: '184 ft', operator: 'Indian Navy / AAI', yearOpened: 1955 },
    ],
    'Gujarat': [
        { id: 'amd', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', iata: 'AMD', icao: 'VAAH', type: 'International', areaAcres: 1200, areaSqKm: 4.9, crew: 3200, dailyFlights: 165, runways: 1, terminals: 2, elevation: '189 ft', operator: 'AAI', yearOpened: 1937 },
        { id: 'stv', name: 'Surat Airport', city: 'Surat', iata: 'STV', icao: 'VASU', type: 'Domestic', areaAcres: 400, areaSqKm: 1.6, crew: 410, dailyFlights: 32, runways: 1, terminals: 1, elevation: '16 ft', operator: 'AAI', yearOpened: 2007 },
        { id: 'bdq', name: 'Vadodara Airport', city: 'Vadodara', iata: 'BDQ', icao: 'VABO', type: 'Domestic', areaAcres: 350, areaSqKm: 1.4, crew: 360, dailyFlights: 24, runways: 1, terminals: 1, elevation: '129 ft', operator: 'AAI', yearOpened: 1949 },
        { id: 'raj', name: 'Rajkot Airport', city: 'Rajkot', iata: 'RAJ', icao: 'VARK', type: 'Domestic', areaAcres: 280, areaSqKm: 1.1, crew: 290, dailyFlights: 18, runways: 1, terminals: 1, elevation: '441 ft', operator: 'AAI', yearOpened: 2004 },
    ],
    'Haryana': [
        { id: 'hsr', name: 'Hisar Airport', city: 'Hisar', iata: 'HSR', icao: 'VIHR', type: 'Domestic', areaAcres: 220, areaSqKm: 0.9, crew: 140, dailyFlights: 6, runways: 1, terminals: 1, elevation: '700 ft', operator: 'AAI', yearOpened: 1965 },
    ],
    'Himachal Pradesh': [
        { id: 'slv', name: 'Shimla Airport', city: 'Shimla', iata: 'SLV', icao: 'VISM', type: 'Domestic', areaAcres: 95, areaSqKm: 0.38, crew: 85, dailyFlights: 4, runways: 1, terminals: 1, elevation: '5072 ft', operator: 'AAI', yearOpened: 1987 },
        { id: 'kul', name: 'Kullu-Manali Airport', city: 'Bhuntar', iata: 'KUU', icao: 'VIBR', type: 'Domestic', areaAcres: 110, areaSqKm: 0.45, crew: 110, dailyFlights: 8, runways: 1, terminals: 1, elevation: '3573 ft', operator: 'AAI', yearOpened: 1995 },
        { id: 'dhm', name: 'Gaggal Airport', city: 'Dharamshala', iata: 'DHM', icao: 'VIGG', type: 'Domestic', areaAcres: 130, areaSqKm: 0.53, crew: 120, dailyFlights: 6, runways: 1, terminals: 1, elevation: '2525 ft', operator: 'AAI', yearOpened: 1966 },
    ],
    'Jammu and Kashmir': [
        { id: 'sxr', name: 'Sheikh ul-Alam International Airport', city: 'Srinagar', iata: 'SXR', icao: 'VISR', type: 'International', areaAcres: 450, areaSqKm: 1.8, crew: 680, dailyFlights: 42, runways: 1, terminals: 1, elevation: '5429 ft', operator: 'AAI', yearOpened: 1987 },
        { id: 'ixj', name: 'Jammu Airport', city: 'Jammu', iata: 'IXJ', icao: 'VIJU', type: 'Domestic', areaAcres: 380, areaSqKm: 1.5, crew: 520, dailyFlights: 38, runways: 1, terminals: 1, elevation: '1029 ft', operator: 'AAI', yearOpened: 1985 },
    ],
    'Jharkhand': [
        { id: 'ixr', name: 'Birsa Munda Airport', city: 'Ranchi', iata: 'IXR', icao: 'VERC', type: 'Domestic', areaAcres: 420, areaSqKm: 1.7, crew: 440, dailyFlights: 34, runways: 1, terminals: 1, elevation: '2148 ft', operator: 'AAI', yearOpened: 2000 },
    ],
    'Karnataka': [
        { id: 'blr', name: 'Kempegowda International Airport', city: 'Bengaluru', iata: 'BLR', icao: 'VOBL', type: 'International', areaAcres: 4000, areaSqKm: 16.2, crew: 9200, dailyFlights: 720, runways: 2, terminals: 2, elevation: '3000 ft', operator: 'BIAL', yearOpened: 2008 },
        { id: 'ixe', name: 'Mangalore International Airport', city: 'Mangaluru', iata: 'IXE', icao: 'VOML', type: 'International', areaAcres: 620, areaSqKm: 2.5, crew: 580, dailyFlights: 28, runways: 1, terminals: 1, elevation: '337 ft', operator: 'AAI', yearOpened: 1951 },
        { id: 'hbx', name: 'Hubballi Airport', city: 'Hubballi', iata: 'HBX', icao: 'VOHB', type: 'Domestic', areaAcres: 290, areaSqKm: 1.2, crew: 240, dailyFlights: 16, runways: 1, terminals: 1, elevation: '2171 ft', operator: 'AAI', yearOpened: 2008 },
        { id: 'myq', name: 'Mysuru Airport', city: 'Mysuru', iata: 'MYQ', icao: 'VOMY', type: 'Domestic', areaAcres: 250, areaSqKm: 1.0, crew: 200, dailyFlights: 10, runways: 1, terminals: 1, elevation: 2349, operator: 'AAI', yearOpened: 2010 },
        { id: 'ixg', name: 'Belagavi Airport', city: 'Belagavi', iata: 'IXG', icao: 'VOBM', type: 'Domestic', areaAcres: 310, areaSqKm: 1.25, crew: 260, dailyFlights: 14, runways: 1, terminals: 1, elevation: '2487 ft', operator: 'AAI', yearOpened: 1947 },
    ],
    'Kerala': [
        { id: 'cok', name: 'Cochin International Airport', city: 'Kochi', iata: 'COK', icao: 'VOCI', type: 'International', areaAcres: 1300, areaSqKm: 5.3, crew: 3400, dailyFlights: 185, runways: 1, terminals: 3, elevation: '30 ft', operator: 'CIAL', yearOpened: 1999 },
        { id: 'trv', name: 'Trivandrum International Airport', city: 'Thiruvananthapuram', iata: 'TRV', icao: 'VOTV', type: 'International', areaAcres: 750, areaSqKm: 3.0, crew: 1800, dailyFlights: 78, runways: 1, terminals: 2, elevation: '15 ft', operator: 'AAI', yearOpened: 1935 },
        { id: 'ccj', name: 'Calicut International Airport', city: 'Kozhikode', iata: 'CCJ', icao: 'VOCL', type: 'International', areaAcres: 680, areaSqKm: 2.8, crew: 1500, dailyFlights: 72, runways: 1, terminals: 1, elevation: '342 ft', operator: 'AAI', yearOpened: 1988 },
        { id: 'cnn', name: 'Kannur International Airport', city: 'Kannur', iata: 'CNN', icao: 'VOKN', type: 'International', areaAcres: 520, areaSqKm: 2.1, crew: 890, dailyFlights: 35, runways: 1, terminals: 1, elevation: '330 ft', operator: 'KIAL', yearOpened: 2018 },
    ],
    'Ladakh': [
        { id: 'ixl', name: 'Kushok Bakula Rimpochee Airport', city: 'Leh', iata: 'IXL', icao: 'VILH', type: 'Domestic', areaAcres: 180, areaSqKm: 0.73, crew: 320, dailyFlights: 18, runways: 1, terminals: 1, elevation: '10682 ft', operator: 'AAI', yearOpened: 1980 },
    ],
    'Madhya Pradesh': [
        { id: 'bho', name: 'Raja Bhoj Airport', city: 'Bhopal', iata: 'BHO', icao: 'VABP', type: 'Domestic', areaAcres: 450, areaSqKm: 1.8, crew: 420, dailyFlights: 32, runways: 1, terminals: 1, elevation: '1711 ft', operator: 'AAI', yearOpened: 1975 },
        { id: 'idr', name: 'Devi Ahilya Bai Holkar Airport', city: 'Indore', iata: 'IDR', icao: 'VAID', type: 'Domestic', areaAcres: 520, areaSqKm: 2.1, crew: 510, dailyFlights: 45, runways: 1, terminals: 1, elevation: '1850 ft', operator: 'AAI', yearOpened: 1948 },
        { id: 'jlr', name: 'Jabalpur Airport', city: 'Jabalpur', iata: 'JLR', icao: 'VAJB', type: 'Domestic', areaAcres: 310, areaSqKm: 1.25, crew: 280, dailyFlights: 18, runways: 1, terminals: 1, elevation: '1624 ft', operator: 'AAI', yearOpened: 1930 },
        { id: 'gwl', name: 'Gwalior Airport', city: 'Gwalior', iata: 'GWL', icao: 'VIGR', type: 'Domestic', areaAcres: 280, areaSqKm: 1.1, crew: 240, dailyFlights: 12, runways: 1, terminals: 1, elevation: '617 ft', operator: 'IAF / AAI', yearOpened: 1942 },
    ],
    'Maharashtra': [
        { id: 'bom', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', iata: 'BOM', icao: 'VABB', type: 'International', areaAcres: 1850, areaSqKm: 7.5, crew: 14200, dailyFlights: 980, runways: 2, terminals: 2, elevation: '39 ft', operator: 'MIAL', yearOpened: 1942 },
        { id: 'pnq', name: 'Pune International Airport', city: 'Pune', iata: 'PNQ', icao: 'VAPO', type: 'International', areaAcres: 680, areaSqKm: 2.8, crew: 1100, dailyFlights: 88, runways: 1, terminals: 1, elevation: '1942 ft', operator: 'AAI', yearOpened: 1939 },
        { id: 'nag', name: 'Dr. Babasaheb Ambedkar International Airport', city: 'Nagpur', iata: 'NAG', icao: 'VANP', type: 'International', areaAcres: 920, areaSqKm: 3.7, crew: 980, dailyFlights: 62, runways: 1, terminals: 1, elevation: '1033 ft', operator: 'MIHAN', yearOpened: 1925 },
        { id: 'ixu', name: 'Aurangabad Airport', city: 'Chhatrapati Sambhajinagar', iata: 'IXU', icao: 'VAAU', type: 'Domestic', areaAcres: 340, areaSqKm: 1.4, crew: 300, dailyFlights: 16, runways: 1, terminals: 1, elevation: '1911 ft', operator: 'AAI', yearOpened: 2008 },
        { id: 'isk', name: 'Nashik Airport', city: 'Nashik', iata: 'ISK', icao: 'VAOZ', type: 'Domestic', areaAcres: 260, areaSqKm: 1.05, crew: 220, dailyFlights: 10, runways: 1, terminals: 1, elevation: '1900 ft', operator: 'AAI', yearOpened: 2014 },
    ],
    'Manipur': [
        { id: 'imf', name: 'Imphal Airport', city: 'Imphal', iata: 'IMF', icao: 'VEIM', type: 'International', areaAcres: 320, areaSqKm: 1.3, crew: 380, dailyFlights: 22, runways: 1, terminals: 1, elevation: '2540 ft', operator: 'AAI', yearOpened: 1956 },
    ],
    'Meghalaya': [
        { id: 'shl', name: 'Shillong Airport', city: 'Umroi', iata: 'SHL', icao: 'VEBI', type: 'Domestic', areaAcres: 200, areaSqKm: 0.8, crew: 160, dailyFlights: 8, runways: 1, terminals: 1, elevation: '2910 ft', operator: 'AAI', yearOpened: 1970 },
    ],
    'Mizoram': [
        { id: 'ajl', name: 'Lengpui Airport', city: 'Aizawl', iata: 'AJL', icao: 'VELP', type: 'Domestic', areaAcres: 280, areaSqKm: 1.1, crew: 210, dailyFlights: 10, runways: 1, terminals: 1, elevation: '1398 ft', operator: 'AAI', yearOpened: 1998 },
    ],
    'Nagaland': [
        { id: 'dmu', name: 'Dimapur Airport', city: 'Dimapur', iata: 'DMU', icao: 'VEMR', type: 'Domestic', areaAcres: 310, areaSqKm: 1.25, crew: 250, dailyFlights: 12, runways: 1, terminals: 1, elevation: '487 ft', operator: 'AAI', yearOpened: 1944 },
    ],
    'Odisha': [
        { id: 'bbi', name: 'Biju Patnaik International Airport', city: 'Bhubaneswar', iata: 'BBI', icao: 'VEBS', type: 'International', areaAcres: 550, areaSqKm: 2.2, crew: 720, dailyFlights: 48, runways: 1, terminals: 1, elevation: '148 ft', operator: 'AAI', yearOpened: 1962 },
        { id: 'jrg', name: 'Veer Surendra Sai Airport', city: 'Jharsuguda', iata: 'JRG', icao: 'VEJH', type: 'Domestic', areaAcres: 240, areaSqKm: 0.97, crew: 190, dailyFlights: 8, runways: 1, terminals: 1, elevation: '755 ft', operator: 'AAI', yearOpened: 2018 },
    ],
    'Punjab': [
        { id: 'atq', name: 'Sri Guru Ram Dass Jee International Airport', city: 'Amritsar', iata: 'ATQ', icao: 'VIAR', type: 'International', areaAcres: 680, areaSqKm: 2.8, crew: 890, dailyFlights: 42, runways: 1, terminals: 1, elevation: '756 ft', operator: 'AAI', yearOpened: 1930 },
        { id: 'luh', name: 'Ludhiana Airport', city: 'Ludhiana', iata: 'LUH', icao: 'VILD', type: 'Domestic', areaAcres: 220, areaSqKm: 0.9, crew: 180, dailyFlights: 8, runways: 1, terminals: 1, elevation: '834 ft', operator: 'AAI', yearOpened: 1981 },
    ],
    'Rajasthan': [
        { id: 'jai', name: 'Jaipur International Airport', city: 'Jaipur', iata: 'JAI', icao: 'VIJP', type: 'International', areaAcres: 850, areaSqKm: 3.4, crew: 1200, dailyFlights: 95, runways: 1, terminals: 2, elevation: '1263 ft', operator: 'AAI', yearOpened: 1945 },
        { id: 'jdh', name: 'Jodhpur Airport', city: 'Jodhpur', iata: 'JDH', icao: 'VIJO', type: 'Domestic', areaAcres: 420, areaSqKm: 1.7, crew: 380, dailyFlights: 22, runways: 1, terminals: 1, elevation: '717 ft', operator: 'IAF / AAI', yearOpened: 1950 },
        { id: 'udr', name: 'Maharana Pratap Airport', city: 'Udaipur', iata: 'UDR', icao: 'VAUD', type: 'Domestic', areaAcres: 350, areaSqKm: 1.4, crew: 340, dailyFlights: 20, runways: 1, terminals: 1, elevation: '1684 ft', operator: 'AAI', yearOpened: 1962 },
        { id: 'jsa', name: 'Jaisalmer Airport', city: 'Jaisalmer', iata: 'JSA', icao: 'VIJR', type: 'Domestic', areaAcres: 280, areaSqKm: 1.1, crew: 200, dailyFlights: 8, runways: 1, terminals: 1, elevation: '751 ft', operator: 'AAI', yearOpened: 2013 },
    ],
    'Sikkim': [
        { id: 'pky', name: 'Pakyong Airport', city: 'Pakyong', iata: 'PYG', icao: 'VEPY', type: 'Domestic', areaAcres: 200, areaSqKm: 0.8, crew: 175, dailyFlights: 6, runways: 1, terminals: 1, elevation: '4590 ft', operator: 'AAI', yearOpened: 2018 },
    ],
    'Tamil Nadu': [
        { id: 'maa', name: 'Chennai International Airport', city: 'Chennai', iata: 'MAA', icao: 'VOMM', type: 'International', areaAcres: 1323, areaSqKm: 5.4, crew: 6800, dailyFlights: 520, runways: 2, terminals: 3, elevation: '52 ft', operator: 'AAI', yearOpened: 1932 },
        { id: 'cjb', name: 'Coimbatore International Airport', city: 'Coimbatore', iata: 'CJB', icao: 'VOCB', type: 'International', areaAcres: 620, areaSqKm: 2.5, crew: 780, dailyFlights: 55, runways: 1, terminals: 1, elevation: '1324 ft', operator: 'AAI', yearOpened: 1940 },
        { id: 'ixm', name: 'Madurai Airport', city: 'Madurai', iata: 'IXM', icao: 'VOMD', type: 'International', areaAcres: 480, areaSqKm: 1.9, crew: 520, dailyFlights: 32, runways: 1, terminals: 1, elevation: '459 ft', operator: 'AAI', yearOpened: 1957 },
        { id: 'trz', name: 'Tiruchirappalli International Airport', city: 'Tiruchirappalli', iata: 'TRZ', icao: 'VOTR', type: 'International', areaAcres: 450, areaSqKm: 1.8, crew: 480, dailyFlights: 28, runways: 1, terminals: 1, elevation: '288 ft', operator: 'AAI', yearOpened: 1940 },
        { id: 'sxv', name: 'Salem Airport', city: 'Salem', iata: 'SXV', icao: 'VOSM', type: 'Domestic', areaAcres: 210, areaSqKm: 0.85, crew: 160, dailyFlights: 6, runways: 1, terminals: 1, elevation: '1008 ft', operator: 'AAI', yearOpened: 1993 },
    ],
    'Telangana': [
        { id: 'hyd', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', iata: 'HYD', icao: 'VOHS', type: 'International', areaAcres: 5945, areaSqKm: 24.1, crew: 7800, dailyFlights: 580, runways: 1, terminals: 1, elevation: '2024 ft', operator: 'GHIAL', yearOpened: 2008 },
    ],
    'Tripura': [
        { id: 'ixa', name: 'Maharaja Bir Bikram Airport', city: 'Agartala', iata: 'IXA', icao: 'VEAT', type: 'International', areaAcres: 380, areaSqKm: 1.5, crew: 420, dailyFlights: 24, runways: 1, terminals: 1, elevation: '46 ft', operator: 'AAI', yearOpened: 1942 },
    ],
    'Uttar Pradesh': [
        { id: 'lko', name: 'Chaudhary Charan Singh International Airport', city: 'Lucknow', iata: 'LKO', icao: 'VILK', type: 'International', areaAcres: 620, areaSqKm: 2.5, crew: 980, dailyFlights: 72, runways: 1, terminals: 2, elevation: '410 ft', operator: 'AAI', yearOpened: 1986 },
        { id: 'vns', name: 'Lal Bahadur Shastri International Airport', city: 'Varanasi', iata: 'VNS', icao: 'VIBN', type: 'International', areaAcres: 480, areaSqKm: 1.9, crew: 620, dailyFlights: 38, runways: 1, terminals: 1, elevation: '266 ft', operator: 'AAI', yearOpened: 1924 },
        { id: 'knu', name: 'Kanpur Airport', city: 'Kanpur', iata: 'KNU', icao: 'VIKA', type: 'Domestic', areaAcres: 290, areaSqKm: 1.2, crew: 240, dailyFlights: 10, runways: 1, terminals: 1, elevation: '411 ft', operator: 'IAF / AAI', yearOpened: 1970 },
        { id: 'agr', name: 'Agra Airport', city: 'Agra', iata: 'AGR', icao: 'VIAG', type: 'Domestic', areaAcres: 320, areaSqKm: 1.3, crew: 280, dailyFlights: 12, runways: 1, terminals: 1, elevation: '551 ft', operator: 'IAF / AAI', yearOpened: 1942 },
        { id: 'gop', name: 'Gorakhpur Airport', city: 'Gorakhpur', iata: 'GOP', icao: 'VEGK', type: 'Domestic', areaAcres: 260, areaSqKm: 1.05, crew: 220, dailyFlights: 10, runways: 1, terminals: 1, elevation: '259 ft', operator: 'IAF / AAI', yearOpened: 1966 },
        { id: 'ixd', name: 'Prayagraj Airport', city: 'Prayagraj', iata: 'IXD', icao: 'VEAB', type: 'Domestic', areaAcres: 280, areaSqKm: 1.1, crew: 260, dailyFlights: 14, runways: 1, terminals: 1, elevation: '322 ft', operator: 'AAI', yearOpened: 1966 },
        { id: 'ayj', name: 'Maharishi Valmiki International Airport', city: 'Ayodhya', iata: 'AYJ', icao: 'VEAY', type: 'International', areaAcres: 350, areaSqKm: 1.4, crew: 380, dailyFlights: 18, runways: 1, terminals: 1, elevation: '335 ft', operator: 'AAI', yearOpened: 2024 },
    ],
    'Uttarakhand': [
        { id: 'ded', name: 'Jolly Grant Airport', city: 'Dehradun', iata: 'DED', icao: 'VIDN', type: 'Domestic', areaAcres: 380, areaSqKm: 1.5, crew: 420, dailyFlights: 28, runways: 1, terminals: 1, elevation: '1831 ft', operator: 'AAI', yearOpened: 1974 },
        { id: 'pgb', name: 'Pantnagar Airport', city: 'Pantnagar', iata: 'PGH', icao: 'VIPT', type: 'Domestic', areaAcres: 240, areaSqKm: 0.97, crew: 200, dailyFlights: 8, runways: 1, terminals: 1, elevation: '769 ft', operator: 'AAI', yearOpened: 2008 },
    ],
    'West Bengal': [
        { id: 'ccu', name: 'Netaji Subhas Chandra Bose International Airport', city: 'Kolkata', iata: 'CCU', icao: 'VECC', type: 'International', areaAcres: 1670, areaSqKm: 6.8, crew: 5200, dailyFlights: 380, runways: 1, terminals: 2, elevation: '16 ft', operator: 'AAI', yearOpened: 1924 },
        { id: 'ixb', name: 'Bagdogra Airport', city: 'Siliguri', iata: 'IXB', icao: 'VEBD', type: 'International', areaAcres: 420, areaSqKm: 1.7, crew: 480, dailyFlights: 32, runways: 1, terminals: 1, elevation: '412 ft', operator: 'IAF / AAI', yearOpened: 1956 },
    ],
    'Chandigarh': [
        { id: 'ixc', name: 'Chandigarh International Airport', city: 'Chandigarh', iata: 'IXC', icao: 'VICG', type: 'International', areaAcres: 530, areaSqKm: 2.1, crew: 680, dailyFlights: 45, runways: 1, terminals: 1, elevation: '1012 ft', operator: 'AAI', yearOpened: 2015 },
    ],
    'Puducherry': [
        { id: 'pnx', name: 'Puducherry Airport', city: 'Puducherry', iata: 'PNY', icao: 'VOPC', type: 'Domestic', areaAcres: 190, areaSqKm: 0.77, crew: 150, dailyFlights: 6, runways: 1, terminals: 1, elevation: '134 ft', operator: 'AAI', yearOpened: 2013 },
    ],
    'Andaman and Nicobar': [
        { id: 'ixz', name: 'Veer Savarkar International Airport', city: 'Port Blair', iata: 'IXZ', icao: 'VOPB', type: 'International', areaAcres: 380, areaSqKm: 1.5, crew: 520, dailyFlights: 28, runways: 1, terminals: 1, elevation: '14 ft', operator: 'AAI', yearOpened: 1962 },
    ],
};

/** Hub airports used to build sample route schedules */
const AIRPORT_ROUTE_HUBS = ['DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'CCU', 'GOI', 'COK', 'AMD', 'PNQ'];

const AIRLINE_NAMES = ['IndiGo', 'Air India', 'SpiceJet', 'Akasa Air', 'Vistara'];
