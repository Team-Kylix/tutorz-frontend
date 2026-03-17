import React, { useState, useEffect } from 'react';
import { getProvinces, getDistricts, getCities } from '../../services/api/locationService';
import Label from '../atoms/Label';

const LocationSelector = ({ onCityChange, initialProvinceId, initialDistrictId, initialCityId, error }) => {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [cities, setCities] = useState([]);

    const [selectedProvince, setSelectedProvince] = useState(initialProvinceId || '');
    const [selectedDistrict, setSelectedDistrict] = useState(initialDistrictId || '');
    const [selectedCity, setSelectedCity] = useState(initialCityId || '');

    // Allow parent to reset or set initial values late
    useEffect(() => {
        if (initialProvinceId) setSelectedProvince(initialProvinceId);
        if (initialDistrictId) setSelectedDistrict(initialDistrictId);
        if (initialCityId) setSelectedCity(initialCityId);
    }, [initialProvinceId, initialDistrictId, initialCityId]);

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
                    setCities([]);
                    
                    // IF the user changed province manually, clear district.
                    // IF it's the initial load and the selectedDistrict belongs to this province, keep it.
                    if (selectedProvince != initialProvinceId) {
                         setSelectedDistrict('');
                         setSelectedCity('');
                    }
                }
            };
            loadDistricts();
        } else {
            setDistricts([]);
            setCities([]);
        }
        return () => { isMounted = false; };
    }, [selectedProvince, initialProvinceId]);

    // Load Cities when District Changes
    useEffect(() => {
        let isMounted = true;
        if (selectedDistrict) {
            const loadCities = async () => {
                const data = await getCities(selectedDistrict);
                if (isMounted) {
                    setCities(data);
                    
                    if (selectedDistrict != initialDistrictId) {
                        setSelectedCity('');
                    }
                }
            };
            loadCities();
        } else {
            setCities([]);
        }
        return () => { isMounted = false; };
    }, [selectedDistrict, initialDistrictId]);

    // Notify Parent when City Changes
    const handleCityChange = (e) => {
        const cityId = e.target.value;
        setSelectedCity(cityId);
        onCityChange(cityId); 
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
                    value={selectedProvince} 
                    onChange={(e) => setSelectedProvince(e.target.value)} 
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
                    value={selectedDistrict} 
                    onChange={(e) => setSelectedDistrict(e.target.value)} 
                    className={selectClass}
                    disabled={!selectedProvince}
                >
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>

            {/* City */}
            <div className={`transition-opacity duration-300 ${!selectedDistrict ? 'opacity-50' : 'opacity-100'}`}>
                <Label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    City / Town <span className="text-red-500">*</span>
                </Label>
                <select 
                    value={selectedCity} 
                    onChange={handleCityChange} 
                    className={selectClass}
                    disabled={!selectedDistrict}
                >
                    <option value="">Select City</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};

export default LocationSelector;