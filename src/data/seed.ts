import type { Paper } from './types'

/**
 * Curated real dataset of landmark and recent protein / biomolecular
 * phase-separation papers. This ships with the app so it shows genuine content
 * on first paint and works fully offline; the live Europe PMC fetch layers the
 * newest papers on top at runtime.
 *
 * Each `abstract` here is an editor-written summary of the paper's main
 * findings (live-fetched papers instead show the journal's own abstract). DOIs,
 * journals and years are real. `areas` are curated; the pipeline re-derives them
 * only if left empty.
 */
type SeedInput = Omit<
  Paper,
  'id' | 'doiUrl' | 'source' | 'pubTypes' | 'providers' | 'isPreprint' | 'preprintServer'
> & {
  doi: string
}

const SEED: SeedInput[] = [
  {
    doi: '10.1126/science.1172046',
    title:
      'Germline P granules are liquid droplets that localize by controlled dissolution/condensation',
    authors: 'Brangwynne CP, Eckmann CR, Courson DS, et al.',
    journal: 'Science',
    issn: '0036-8075',
    year: 2009,
    areas: ['animal', 'biophysics'],
    abstract:
      'P granules in the C. elegans germline behave as liquid droplets: they dissolve and condense, fuse, drip and are deformed by shear. Their asymmetric segregation to the posterior arises from position-dependent, controlled dissolution and condensation rather than directed transport, establishing liquid–liquid phase separation as an organizing principle for membraneless organelles.',
  },
  {
    doi: '10.1038/nature10879',
    title: 'Phase transitions in the assembly of multivalent signalling proteins',
    authors: 'Li P, Banjade S, Cheng HC, et al.',
    journal: 'Nature',
    issn: '0028-0836',
    year: 2012,
    areas: ['biophysics', 'animal'],
    abstract:
      'Engineered and natural multivalent proteins (SH3 domains and proline-rich motifs, and the Nck/N-WASP/nephrin system) undergo sharp liquid–liquid phase separation above a threshold concentration and valency. Phase separation coincides with a switch in biochemical activity, showing that multivalency-driven condensation can organize signalling.',
  },
  {
    doi: '10.1016/j.cell.2012.04.017',
    title:
      'Cell-free formation of RNA granules: low complexity sequence domains form dynamic fibers within hydrogels',
    authors: 'Kato M, Han TW, Xie S, et al.',
    journal: 'Cell',
    issn: '0092-8674',
    year: 2012,
    areas: ['biophysics'],
    abstract:
      'Low-complexity (LC) domains of RNA-binding proteins such as FUS reversibly form hydrogels built from amyloid-like fibers. These LC-domain interactions retain RNA granule components and are dynamic and reversible, linking sequence-encoded self-association to granule assembly.',
  },
  {
    doi: '10.1073/pnas.1504822112',
    title:
      'The disordered P granule protein LAF-1 drives phase separation into droplets with tunable viscosity and dynamics',
    authors: 'Elbaum-Garfinkle S, Kim Y, Szczepaniak K, et al.',
    journal:
      'Proceedings of the National Academy of Sciences of the United States of America',
    issn: '0027-8424',
    year: 2015,
    areas: ['biophysics'],
    abstract:
      'Purified LAF-1, a DDX3 RNA helicase, phase separates in vitro into liquid droplets recapitulating P-granule behavior. Its intrinsically disordered RGG domain is necessary and sufficient for droplet formation, and RNA lowers droplet viscosity and increases internal dynamics, providing a tunable model of condensate material properties.',
  },
  {
    doi: '10.1038/nphys3532',
    title: 'Polymer physics of intracellular phase transitions',
    authors: 'Brangwynne CP, Tompa P, Pappu RV',
    journal: 'Nature Physics',
    issn: '1745-2473',
    year: 2015,
    areas: ['biophysics'],
    abstract:
      'A framework casting intracellular condensates in terms of associative and block-copolymer physics, connecting multivalent "stickers and spacers" architecture of intrinsically disordered and modular proteins to phase behavior, and laying out how sequence features tune saturation concentrations and material state.',
  },
  {
    doi: '10.1016/j.molcel.2015.01.013',
    title:
      'Phase transition of a disordered nuage protein generates environmentally responsive membraneless organelles',
    authors: 'Nott TJ, Petsalaki E, Farber P, et al.',
    journal: 'Molecular Cell',
    issn: '1097-2765',
    year: 2015,
    areas: ['biophysics'],
    abstract:
      'The disordered RGG/RG protein Ddx4 phase separates into liquid organelles whose formation depends on temperature, ionic strength and RG methylation. The droplets are non-stoichiometric, concentrate single-stranded nucleic acids and can locally destabilize duplex DNA, illustrating environmentally tunable condensates.',
  },
  {
    doi: '10.1016/j.cell.2015.07.047',
    title:
      'A liquid-to-solid phase transition of the ALS protein FUS accelerated by disease mutation',
    authors: 'Patel A, Lee HO, Jawerth L, et al.',
    journal: 'Cell',
    issn: '0092-8674',
    year: 2015,
    areas: ['animal', 'biophysics'],
    abstract:
      'FUS forms liquid droplets that age into an aberrant solid state over time; ALS-causing mutations accelerate this liquid-to-solid transition and fiber formation. This links condensate aging to pathological aggregation in neurodegeneration.',
  },
  {
    doi: '10.1016/j.cell.2015.09.015',
    title:
      'Phase separation by low complexity domains promotes stress granule assembly and drives pathological fibrillization',
    authors: 'Molliex A, Temirov J, Lee J, et al.',
    journal: 'Cell',
    issn: '0092-8674',
    year: 2015,
    areas: ['animal', 'biophysics'],
    abstract:
      'The low-complexity domain of hnRNPA1 drives phase separation and stress-granule assembly; disease mutations promote fibrillization within the liquid phase. The work ties condensate dynamics to both normal stress-granule biology and multisystem proteinopathy.',
  },
  {
    doi: '10.1126/science.aad9964',
    title:
      'Phase separation of signaling molecules promotes T cell receptor signal transduction',
    authors: 'Su X, Ditlev JA, Hui E, et al.',
    journal: 'Science',
    issn: '0036-8075',
    year: 2016,
    areas: ['animal', 'biophysics'],
    abstract:
      'Reconstituted LAT, Grb2, SOS1 and other TCR components phase separate into clusters on membranes. These condensates concentrate signaling enzymes, exclude a phosphatase and promote actin assembly, showing phase separation shapes membrane receptor signaling.',
  },
  {
    doi: '10.1016/j.cell.2016.04.047',
    title: 'Coexisting liquid phases underlie nucleolar subcompartments',
    authors: 'Feric M, Vaidya N, Harmon TS, et al.',
    journal: 'Cell',
    issn: '0092-8674',
    year: 2016,
    areas: ['biophysics'],
    abstract:
      'The nucleolus is a multiphase liquid: its subcompartments are immiscible coexisting liquids whose relative surface tensions dictate their nested arrangement. This explains the layered organization of the nucleolus through differential phase behavior.',
  },
  {
    doi: '10.7554/eLife.13571',
    title:
      'Nucleophosmin integrates within the nucleolus via multi-modal interactions with proteins displaying R-rich linear motifs and rRNA',
    authors: 'Mitrea DM, Cika JA, Guy CS, et al.',
    journal: 'eLife',
    issn: '2050-084X',
    year: 2016,
    areas: ['biophysics'],
    abstract:
      'Nucleophosmin (NPM1) undergoes phase separation via heterotypic interactions with arginine-rich linear motifs and rRNA, providing a molecular basis for assembly of the granular component of the nucleolus.',
  },
  {
    doi: '10.1016/j.cell.2016.06.010',
    title: 'Compositional control of phase-separated cellular bodies',
    authors: 'Banani SF, Rice AM, Peeples WB, et al.',
    journal: 'Cell',
    issn: '0092-8674',
    year: 2016,
    areas: ['biophysics'],
    abstract:
      'Using scaffold–client systems, the study shows condensate composition is governed by the valency and stoichiometry of interacting components. Scaffolds recruit clients, and switches in valency reorganize which molecules partition into a body, defining rules for compositional control.',
  },
  {
    doi: '10.1038/nature22822',
    title:
      'Liquid droplet formation by HP1α suggests a role for phase separation in heterochromatin',
    authors: 'Larson AG, Elnatan D, Keenen MM, et al.',
    journal: 'Nature',
    issn: '0028-0836',
    year: 2017,
    areas: ['animal', 'biophysics'],
    abstract:
      'Human HP1α phase separates upon phosphorylation or DNA binding, forming liquid droplets that compact and compartmentalize DNA. This suggests heterochromatin domains form in part through phase separation.',
  },
  {
    doi: '10.1038/nature22989',
    title: 'Phase separation drives heterochromatin domain formation',
    authors: 'Strom AR, Emelyanov AV, Mir M, et al.',
    journal: 'Nature',
    issn: '0028-0836',
    year: 2017,
    areas: ['animal', 'biophysics'],
    abstract:
      'In Drosophila and mammalian cells, HP1a forms liquid condensates during early development, and heterochromatin exhibits liquid-like properties. Phase separation provides a mechanism to spatially segregate and compact silenced chromatin.',
  },
  {
    doi: '10.1016/j.cell.2017.02.027',
    title:
      'Stress-triggered phase separation is an adaptive, evolutionarily tuned response',
    authors: 'Riback JA, Katanski CD, Kear-Scott JL, et al.',
    journal: 'Cell',
    issn: '0092-8674',
    year: 2017,
    areas: ['biophysics'],
    abstract:
      'The yeast poly(A)-binding protein Pab1 phase separates in response to physiological stress (temperature, pH). Condensation is an adaptive, evolutionarily tuned sensor that promotes fitness, rather than a purely pathological event.',
  },
  {
    doi: '10.1038/nrm.2017.7',
    title: 'Biomolecular condensates: organizers of cellular biochemistry',
    authors: 'Banani SF, Lee HO, Hyman AA, Rosen MK',
    journal: 'Nature Reviews Molecular Cell Biology',
    issn: '1471-0072',
    year: 2017,
    areas: ['biophysics'],
    abstract:
      'A foundational review framing membraneless organelles as biomolecular condensates formed by phase separation of multivalent macromolecules, introducing scaffold/client concepts and surveying their roles in concentrating, sequestering and organizing cellular biochemistry.',
  },
  {
    doi: '10.1126/science.aaf4382',
    title: 'Liquid phase condensation in cell physiology and disease',
    authors: 'Shin Y, Brangwynne CP',
    journal: 'Science',
    issn: '0036-8075',
    year: 2017,
    areas: ['biophysics'],
    abstract:
      'A review of how liquid–liquid phase separation underlies formation of condensates across cell physiology, the biophysical principles involved, tools to probe them, and how aberrant phase transitions contribute to disease.',
  },
  {
    doi: '10.1038/nchem.2803',
    title:
      'Phase behaviour of disordered proteins underlying low density and high permeability of liquid organelles',
    authors: 'Wei MT, Elbaum-Garfinkle S, Holehouse AS, et al.',
    journal: 'Nature Chemistry',
    issn: '1755-4330',
    year: 2017,
    areas: ['biophysics'],
    abstract:
      'Combining experiment and polymer theory, the study shows disordered proteins form condensates that are surprisingly low-density and permeable. Chain conformations within droplets set mesh size and permeability, explaining rapid molecular exchange in liquid organelles.',
  },
  {
    doi: '10.1126/science.aar3958',
    title:
      'Coactivator condensation at super-enhancers links phase separation and gene control',
    authors: 'Sabari BR, Dall’Agnese A, Boija A, et al.',
    journal: 'Science',
    issn: '0036-8075',
    year: 2018,
    areas: ['animal'],
    abstract:
      'The coactivator BRD4 and Mediator subunit MED1 form phase-separated condensates at super-enhancers. These condensates compartmentalize and concentrate the transcription apparatus, linking phase separation to high-level gene activation.',
  },
  {
    doi: '10.1016/j.cell.2018.06.006',
    title:
      'A molecular grammar governing the driving forces for phase separation of prion-like RNA binding proteins',
    authors: 'Wang J, Choi JM, Holehouse AS, et al.',
    journal: 'Cell',
    issn: '0092-8674',
    year: 2018,
    areas: ['biophysics'],
    abstract:
      'A "stickers and spacers" grammar in which tyrosine and arginine residues act as cohesive stickers quantitatively predicts the phase behavior of FUS-family prion-like domains. The number and patterning of stickers sets the saturation concentration.',
  },
  {
    doi: '10.1016/j.cell.2018.10.042',
    title:
      'Transcription factors activate genes through the phase-separation capacity of their activation domains',
    authors: 'Boija A, Klein IA, Sabari BR, et al.',
    journal: 'Cell',
    issn: '0092-8674',
    year: 2018,
    areas: ['animal'],
    abstract:
      'Transcription-factor activation domains phase separate with the Mediator coactivator, and this capacity correlates with transactivation. Gene activation is proposed to occur via condensate formation between activation domains and coactivators.',
  },
  {
    doi: '10.1016/j.cell.2018.12.035',
    title:
      'Considerations and challenges in studying liquid-liquid phase separation and biomolecular condensates',
    authors: 'Alberti S, Gladfelter A, Mittag T',
    journal: 'Cell',
    issn: '0092-8674',
    year: 2019,
    areas: ['biophysics'],
    abstract:
      'A critical primer laying out rigorous criteria and controls for claiming phase separation in vitro and in cells, cautioning against over-interpretation and providing a checklist of biophysical evidence needed to establish condensate behavior.',
  },
  {
    doi: '10.1038/s41586-019-1165-8',
    title:
      'Arabidopsis FLL2 promotes liquid-liquid phase separation of polyadenylation complexes',
    authors: 'Fang X, Wang L, Ishikawa R, et al.',
    journal: 'Nature',
    issn: '0028-0836',
    year: 2019,
    areas: ['plant'],
    abstract:
      'The coiled-coil protein FLL2 promotes phase separation of the mRNA 3′ processing machinery in Arabidopsis, forming condensates required for proximal polyadenylation of the antisense COOLAIR transcript at the flowering-time gene FLC, linking condensation to plant developmental gene regulation.',
  },
  {
    doi: '10.1016/j.molcel.2019.06.044',
    title:
      'Nucleo-cytoplasmic partitioning of ARF transcription factors controls auxin responses in Arabidopsis thaliana',
    authors: 'Powers SK, Holehouse AS, Korasick DA, et al.',
    journal: 'Molecular Cell',
    issn: '1097-2765',
    year: 2019,
    areas: ['plant'],
    abstract:
      'AUXIN RESPONSE FACTOR (ARF) proteins in Arabidopsis form cytoplasmic condensates that sequester them away from the nucleus, tuning auxin-responsive transcription. Condensation provides a developmentally patterned switch controlling hormone signaling in plants.',
  },
  {
    doi: '10.1016/j.devcel.2020.09.010',
    title: 'Emerging roles for phase separation in plants',
    authors: 'Emenecker RJ, Holehouse AS, Strader LC',
    journal: 'Developmental Cell',
    issn: '1534-5807',
    year: 2020,
    areas: ['plant'],
    abstract:
      'A review synthesizing evidence that biomolecular condensates govern diverse plant processes—temperature sensing, hormone signaling, RNA processing and stress responses—and highlighting plant-specific opportunities and open questions for the field.',
  },
  {
    doi: '10.1038/s41586-020-2644-7',
    title: 'A prion-like domain in ELF3 functions as a thermosensor in Arabidopsis',
    authors: 'Jung JH, Barbosa AD, Hutin S, et al.',
    journal: 'Nature',
    issn: '0028-0836',
    year: 2020,
    areas: ['plant', 'biophysics'],
    abstract:
      'The evening-complex protein ELF3 contains a polyQ prion-like domain that drives temperature-dependent phase separation. Warmth triggers ELF3 condensation, sequestering it and de-repressing thermoresponsive growth, defining a molecular thermosensor in plants.',
  },
  {
    doi: '10.1016/j.cell.2021.06.009',
    title:
      'A prion-like protein regulator of seed germination undergoes hydration-dependent phase separation',
    authors: 'Dorone Y, Boeynaems S, Flores E, et al.',
    journal: 'Cell',
    issn: '0092-8674',
    year: 2021,
    areas: ['plant', 'biophysics'],
    abstract:
      'The Arabidopsis prion-like protein FLOE1 senses water availability by phase separating upon hydration, allowing seeds to gauge their environment and modulate germination. It provides a hydration-dependent condensate sensor governing a key plant developmental decision.',
  },
  {
    doi: '10.1038/s41580-020-0264-6',
    title: 'RNA contributions to the form and function of biomolecular condensates',
    authors: 'Roden C, Gladfelter AS',
    journal: 'Nature Reviews Molecular Cell Biology',
    issn: '1471-0072',
    year: 2021,
    areas: ['biophysics'],
    abstract:
      'A review detailing how RNA sequence, structure and concentration shape condensate assembly, composition, material properties and dissolution, arguing RNA is an active determinant—not a passive client—of condensate form and function.',
  },
]

export const SEED_PAPERS: Paper[] = SEED.map((s, i) => ({
  ...s,
  id: `seed:${i}`,
  source: 'SEED',
  doiUrl: `https://doi.org/${s.doi}`,
  pubTypes: ['Journal Article'],
  providers: ['europepmc'],
  isPreprint: false,
}))
