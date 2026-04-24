import React, { useState, useEffect, useRef } from 'react';
import { getProvinces, getDistricts, getCities } from '../../services/api/locationService';
import Label from '../atoms/Label';

const LocationSelector = ({ 
    onProvinceChange, 
    onDistrictChange, 
    onCityChange, 
    initialProvinceId, 
    initialDistrictId, 
    initialCityId, 
    error,
    showCity = true
}) => {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [cities, setCities] = useState([]);

    const [selectedProvince, setSelectedProvince] = useState(initialProvinceId || '');
    const [selectedDistrict, setSelectedDistrict] = useState(initialDistrictId || '');
    const [selectedCity, setSelectedCity] = useState(initialCityId || '');

    const onProvinceChangeRef = useRef(onProvinceChange);
    const onDistrictChangeRef = useRef(onDistrictChange);
    const onCityChangeRef = useRef(onCityChange);
    const selectedDistrictRef = useRef(selectedDistrict);
    const selectedCityRef = useRef(selectedCity);

    useEffect(() => {
        onProvinceChangeRef.current = onProvinceChange;
        onDistrictChangeRef.current = onDistrictChange;
        onCityChangeRef.current = onCityChange;
        selectedDistrictRef.current = selectedDistrict;
        selectedCityRef.current = selectedCity;
    });

    // Allow parent to reset or set initial values late, independently
    useEffect(() => {
        if (initialProvinceId) setSelectedProvince(initialProvinceId);
    }, [initialProvinceId]);

    useEffect(() => {
        if (initialDistrictId) setSelectedDistrict(initialDistrictId);
    }, [initialDistrictId]);

    useEffect(() => {
        if (initialCityId) setSelectedCity(initialCityId);
    }, [initialCityId]);

    // Load Provinces on Mount
    useEffect(() => {
        const loadProvinces = async () => {
            const data = await getProvinces();
            setProvinces(data);
        };
        loadProvinces();
    }, []);

    // Load Districts when Province Changes
    useEffect(() => {
        let isMounted = true;
        if (selectedProvince) {
            const loadDistricts = async () => {
                const data = await getDistricts(selectedProvince);
                if (isMounted) {
                    setDistricts(data);
                    
                    if (selectedDistrictRef.current) {
                        const isValid = data.some(d => d.id?.toString() === selectedDistrictRef.current?.toString());
                        if (!isValid) {
                            setSelectedDistrict('');
                            if (onDistrictChangeRef.current) onDistrictChangeRef.current('');
                            setSelectedCity('');
                            if (onCityChangeRef.current) onCityChangeRef.current('');
                        }
                    }
                }
            };
            loadDistricts();
        } else {
            setDistricts([]);
            setCities([]);
            setSelectedDistrict('');
            if (onDistrictChangeRef.current && selectedDistrictRef.current) onDistrictChangeRef.current('');
            setSelectedCity('');
            if (onCityChangeRef.current && selectedCityRef.current) onCityChangeRef.current('');
        }
        return () => { isMounted = false; };
    }, [selectedProvince]);

    // Load Cities when District Changes
    useEffect(() => {
        let isMounted = true;
        if (selectedDistrict) {
            const loadCities = async () => {
                const data = await getCities(selectedDistrict);
                if (isMounted) {
                    setCities(data);
                    
                    if (selectedCityRef.current) {
                        const isValid = data.some(c => c.id?.toString() === selectedCityRef.current?.toString());
                        if (!isValid) {
                            setSelectedCity('');
                            if (onCityChangeRef.current) onCityChangeRef.current('');
                        }
                    }
                }
            };
            loadCities();
        } else {
            setCities([]);
            setSelectedCity('');
            if (onCityChangeRef.current && selectedCityRef.current) onCityChangeRef.current('');
        }
        return () => { isMounted = false; };
    }, [selectedDistrict]);

    const handleProvinceChange = (e) => {
        const val = e.target.value;
        setSelectedProvince(val);
        if (onProvinceChange) onProvinceChange(val);
    };

    const handleDistrictChange = (e) => {
        const val = e.target.value;
        setSelectedDistrict(val);
        if (onDistrictChange) onDistrictChange(val);
    };

    const handleCityChange = (e) => {
        const val = e.target.value;
        setSelectedCity(val);
        if (onCityChange) onCityChange(val); 
    };

    const selectClass = `w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-200 outline-none transition-all ${error ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`;

    return (
        <div className="space-y-4">
            {/* CHANGED: Removed 'grid-cols-3' to make them stack vertically.
               This aligns with "first select province, below that District..."
            */}
            
            {/* Province */}
            <div>
                <Label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Province <span className="text-red-500">*</span>
                </Label>
                <select 
                    required
                    value={selectedProvince} 
                    onChange={handleProvinceChange} 
                    className={selectClass}
                >
                    <option value="">Select Province</option>
                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>

            {/* District */}
            <div className={`transition-opacity duration-300 ${!selectedProvince ? 'opacity-50' : 'opacity-100'}`}>
                <Label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    District <span className="text-red-500">*</span>
                </Label>
                <select 
                    required
                    value={selectedDistrict} 
                    onChange={handleDistrictChange} 
                    className={selectClass}
                    disabled={!selectedProvince}
                >
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>

            {/* City */}
            {showCity && (
                <div className={`transition-opacity duration-300 ${!selectedDistrict ? 'opacity-50' : 'opacity-100'}`}>
                    <Label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        City / Town <span className="text-red-500">*</span>
                    </Label>
                    <select 
                        required
                        value={selectedCity} 
                        onChange={handleCityChange} 
                        className={selectClass}
                        disabled={!selectedDistrict}
                    >
                        <option value="">Select City</option>
                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            )}

            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};

export default LocationSelector;