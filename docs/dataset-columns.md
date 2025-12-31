# Dataset Column Reference

Current Austin Construction Permits dataset column information.

## Dataset Stats

- **File**: `data/Issued_Construction_Permits_20251212.csv`
- **Size**: ~1.5 GB
- **Records**: 2,458,644
- **Columns**: 68

## All Available Columns

After normalization (lowercase, spaces → underscores), the pipeline sees these columns:

### Permit Information
1. `permit_type` - Permit type code (e.g., "PP", "BP", "EP")
2. `permit_type_desc` - Full description of permit type
3. `permit_num` - Unique permit number
4. `permit_class_mapped` - Mapped permit classification
5. `permit_class` - Permit class code
6. `work_class` - Type of work (e.g., "Addition and Remodel", "New")
7. `condominium` - Is it a condo? (Yes/No)
8. `project_name` - Name of the project
9. `description` - **Main text description of the work** (key field for NLP)

### Property Information
10. `tcad_id` - Travis County Appraisal District ID
11. `property_legal_description` - Legal property description
12. `original_address_1` - Street address
13. `original_city` - City
14. `original_state` - State
15. `original_zip` - ZIP code
16. `council_district` - Austin council district
17. `jurisdiction` - Jurisdiction
18. `latitude` - Latitude coordinate
19. `longitude` - Longitude coordinate
20. `location` - Combined location string

### Dates
21. `applied_date` - When permit was applied for
22. `issued_date` - When permit was issued
23. `status_date` - Last status update date
24. `expires_date` - Permit expiration date
25. `completed_date` - Completion date
26. `day_issued` - Day of week issued
27. `calendar_year_issued` - Year issued
28. `fiscal_year_issued` - Fiscal year issued
29. `issued_in_last_30_days` - Boolean flag

### Valuations & Measurements
30. `total_existing_bldg_sqft` - Existing building square footage
31. `remodel_repair_sqft` - Remodel/repair square footage
32. `total_new_add_sqft` - New addition square footage
33. `total_valuation_remodel` - Remodel valuation
34. `total_job_valuation` - Total job valuation
35. `number_of_floors` - Number of floors
36. `housing_units` - Number of housing units
37. `total_lot_sqft` - Total lot square footage

### Component Valuations
38. `building_valuation` - Building work valuation
39. `building_valuation_remodel` - Building remodel valuation
40. `electrical_valuation` - Electrical work valuation
41. `electrical_valuation_remodel` - Electrical remodel valuation
42. `mechanical_valuation` - Mechanical work valuation
43. `mechanical_valuation_remodel` - Mechanical remodel valuation
44. `plumbing_valuation` - Plumbing work valuation
45. `plumbing_valuation_remodel` - Plumbing remodel valuation
46. `medgas_valuation` - Medical gas work valuation
47. `medgas_valuation_remodel` - Medical gas remodel valuation

### Contractor Information
48. `contractor_trade` - Contractor's trade
49. `contractor_company_name` - Company name
50. `contractor_full_name` - Contractor name
51. `contractor_phone` - Phone number
52. `contractor_address_1` - Address line 1
53. `contractor_address_2` - Address line 2
54. `contractor_city` - City
55. `contractor_zip` - ZIP code

### Applicant Information
56. `applicant_full_name` - Applicant name
57. `applicant_organization` - Organization
58. `applicant_phone` - Phone number
59. `applicant_address_1` - Address line 1
60. `applicant_address_2` - Address line 2
61. `applicant_city` - City
62. `applicant_zip` - ZIP code

### Other
63. `status_current` - Current permit status
64. `issuance_method` - How permit was issued
65. `link` - URL to permit details
66. `project_id` - Project ID
67. `master_permit_num` - Master permit number
68. `certificate_of_occupancy` - Certificate of occupancy info

## Columns Used by Pipeline

### Text Columns for NLP Enrichment
The pipeline extracts keywords from these text fields:

```python
TEXT_COLUMNS = [
    "description",        # Main permit description (MOST IMPORTANT)
    "work_class",        # Type of work
    "permit_class",      # Permit classification
    "permit_type_desc",  # Detailed permit type
    "permit_type"        # Permit type code
]
```

### Numeric Columns Cleaned
```python
numeric_cols = [
    "total_existing_bldg_sqft",
    "remodel_repair_sqft",
    "total_new_add_sqft",
    "total_valuation_remodel",
    "total_job_valuation",
    "number_of_floors",
    "housing_units",
    "building_valuation",
    "building_valuation_remodel",
    "electrical_valuation",
    "electrical_valuation_remodel",
    "mechanical_valuation",
    "mechanical_valuation_remodel",
    "plumbing_valuation",
    "plumbing_valuation_remodel",
    "medgas_valuation",
    "medgas_valuation_remodel",
    "total_lot_sqft"
]
```

### Date Columns Parsed
```python
date_cols = [
    "applied_date",
    "issued_date",
    "status_date",
    "expires_date",
    "completed_date"
]
```

### ZIP Code Sources
The pipeline tries to extract ZIP codes from (in order):
1. `original_zip`
2. `contractor_zip`
3. `applicant_zip`

## Example Record

```csv
Permit Type: PP (Plumbing Permit)
Description: "Interior Remodel"
Work Class: Addition and Remodel
Latitude: 30.267
Longitude: -97.743
Original Zip: 78701
```

## Keywords Extracted

The NLP enrichment searches for these keywords in text columns:

- **Energy**: solar, PV, photovoltaic, generator, battery
- **Construction**: residential, commercial, remodel, repair, new, demolition
- **Building**: foundation, roof, window
- **Systems**: permit, hvac, electrical, plumbing, mechanical
- **Housing**: multi-family, single-family

Each keyword becomes a feature column like: `f_description_kw_solar`
