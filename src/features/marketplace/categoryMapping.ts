export const CATEGORY_GROUPS: Record<string, string[]> = {
    'Industrial & Manufacturing': [
        'Automation',
        'Automation Solutions',
        'Factory Automation Solution',
        'Industrial Automation',
        'Industrial Equipment',
        'Industrial Gases',
        'Industrial Solutions',
        'Industrial Tools',
        'Manufacturing',
        'Production Lines',
        'Heavy Equipments',
        'Equipments',
        'Machines Service',
        'Machines Services',
        'Mechanical Engineering',
        'Spare Parts Machine (SPM)',
        'Stanless Steel',
        'Stanless Steel Parts',
        'Plastic',
        'Plastic Products',
        'Plastics & Wood Pallets',
        'Printing Products Mannufacturing',
        'Solar Energy',
        'Waste Collection',
        'workshop'
    ],
    'Construction & Materials': [
        'Automatic Doors',
        'Cables',
        'Constructions',
        'Contracting & Maintenance',
        'Contracting Works',
        'General Contracting',
        'Materials',
        'Minerals',
        'Raw Material',
        'Raw Materials',
        'Smart & Health Building',
        'Water',
        'Water & Power Services',
        'Water Techbologies',
        'Electrical',
        'Electro Mechanicals Services'
    ],
    'Automotive & Transport': [
        'Cars',
        'Cars Showroom',
        'Commercial Vehicles',
        'Light Equipment Rent',
        'Petorl & Diesel',
        'Spare Parts Trucks (SPT)',
        'Trucks'
    ],
    'Office & Business Services': [
        'Advertising',
        'Computer',
        'Employment Promoters',
        'Human Resources',
        'Human Resources Solutions',
        'Investing',
        'IT Solution',
        'Office supplies',
        'Packing',
        'Packing & Printing',
        'Papers',
        'Printing',
        'Security',
        'Security & Communication System',
        'Sticker',
        'Systems',
        'Technology',
        'Trading',
        'Trading Company'
    ],
    'Specialized Services': [
        'Calibration Laboratory',
        'Enviromental & Process Engineering',
        'Enviromental Consultation',
        'Enviromental Services',
        'Enviromental Solutions',
        'Laboratory Products',
        'Laboratry Analysis',
        'Laptop Maintinance',
        'Maintinance and Cleaning',
        'Medical',
        'Medical Supplies',
        'Pest Control',
        'Safety Equipments',
        'Scales',
        'Spare Parts',
        'Spare Parts & Equipments'
    ],
    'Consumer & Lifestyle': [
        'Hotel',
        'Housing',
        'Liquids',
        'Mattressess etc',
        'Uniform'
    ],
    'Other': [
        'Category',
        'Other'
    ]
};

// Helper to find group for a category
export const getCategoryGroup = (category: string): string => {
    // Normalize category string (trim whitespace)
    const normalizedCategory = category.trim();

    for (const [group, categories] of Object.entries(CATEGORY_GROUPS)) {
        if (categories.includes(normalizedCategory)) {
            return group;
        }
    }
    return 'Other';
};
