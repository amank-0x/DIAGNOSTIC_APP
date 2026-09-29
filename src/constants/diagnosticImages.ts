import heroLabImg from '../assets/images/hero_diagnostic_laboratory_1790618473133.jpg';
import pathologyMicroscopeImg from '../assets/images/pathology_microscope_testing_1790618487212.jpg';
import healthPackagesTubesImg from '../assets/images/preventive_health_packages_tubes_1790618499622.jpg';
import homeCollectionKitImg from '../assets/images/home_sample_collection_kit_1790618512126.jpg';
import diagnosticCenterFacilityImg from '../assets/images/diagnostic_center_facility_1790618523679.jpg';

/**
 * Official Diagnostic & Pathology Visual Context Assets for B.L. Diagnostic Center.
 *
 * STRICT VISUAL POLICY:
 * - Only clinical laboratory instruments, microscopes, vacutainer blood sample tubes,
 *   sterile home collection kits, and clean diagnostic laboratory interiors.
 * - Zero hospital beds/wards, zero doctors, zero invented staff names.
 */
export const DIAGNOSTIC_IMAGES = {
  heroLab: {
    src: heroLabImg,
    alt: 'Modern automated clinical pathology and diagnostic testing laboratory equipment',
    caption: 'Automated Hematology & Biochemistry Diagnostic Laboratory Environment',
  },
  pathologyTesting: {
    src: pathologyMicroscopeImg,
    alt: 'High-precision binocular pathology microscope and labeled blood sample tubes',
    caption: 'Clinical Pathology & Microscopic Specimen Analysis',
  },
  healthPackages: {
    src: healthPackagesTubesImg,
    alt: 'Color-coded vacutainer blood collection tubes organized for preventive health profiles',
    caption: 'Routine & Preventive Metabolic Screening Panels',
  },
  homeCollection: {
    src: homeCollectionKitImg,
    alt: 'Sterile temperature-controlled home sample collection kit with sealed vacutainer tubes',
    caption: 'Sterile Single-Use Doorstep Sample Collection Kit',
  },
  centerFacility: {
    src: diagnosticCenterFacilityImg,
    alt: 'Clean modern diagnostic pathology laboratory interior and specimen processing station',
    caption: 'B.L. Diagnostic Center — Clinical Pathology & Specimen Processing',
  },
} as const;
