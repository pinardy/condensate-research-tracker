import type { JournalAllowEntry } from './types'

/**
 * Curated allowlist of reputable journals with Journal Impact Factor >= 4.
 *
 * WHY A LIST: Journal Impact Factor is a proprietary Clarivate (JCR) metric and
 * is not exposed by any free research API, so "IF >= 4" cannot be looked up at
 * runtime. This hand-maintained allowlist is how the app enforces that rule:
 * only papers whose journal matches an entry here are shown.
 *
 * TO EDIT: add/remove entries below. Matching is by ISSN first (most robust),
 * then by normalized journal title/abbreviation (see classify.ts). The
 * `impactFactor` values are indicative recent JCR figures and only drive the
 * "IF" badge — keep every entry at 4.0 or above to honor the threshold.
 */
export const JOURNAL_ALLOWLIST: JournalAllowEntry[] = [
  // --- General / multidisciplinary ---
  { name: 'Nature', issns: ['0028-0836', '1476-4687'], impactFactor: 50.5 },
  { name: 'Science', issns: ['0036-8075', '1095-9203'], impactFactor: 44.7 },
  { name: 'Science Advances', issns: ['2375-2548'], impactFactor: 11.7 },
  { name: 'Proceedings of the National Academy of Sciences of the United States of America', issns: ['0027-8424', '1091-6490'], impactFactor: 9.4 },
  { name: 'Nature Communications', issns: ['2041-1723'], impactFactor: 14.7 },
  { name: 'eLife', issns: ['2050-084X'], impactFactor: 6.4 },
  { name: 'PLoS Biology', issns: ['1544-9173', '1545-7885'], impactFactor: 7.8 },

  // --- Cell / molecular biology ---
  { name: 'Cell', issns: ['0092-8674', '1097-4172'], impactFactor: 45.5 },
  { name: 'Molecular Cell', issns: ['1097-2765', '1097-4164'], impactFactor: 14.5 },
  { name: 'Nature Cell Biology', issns: ['1465-7392', '1476-4679'], impactFactor: 17.3 },
  { name: 'Nature Structural & Molecular Biology', issns: ['1545-9993', '1545-9985'], impactFactor: 12.5 },
  { name: 'Nature Reviews Molecular Cell Biology', issns: ['1471-0072', '1471-0080'], impactFactor: 81.3 },
  { name: 'Journal of Cell Biology', issns: ['0021-9525', '1540-8140'], impactFactor: 7.4 },
  { name: 'Developmental Cell', issns: ['1534-5807', '1878-1551'], impactFactor: 10.7 },
  { name: 'Current Biology', issns: ['0960-9822', '1879-0445'], impactFactor: 7.5 },
  { name: 'Cell Reports', issns: ['2211-1247'], impactFactor: 7.5 },
  { name: 'Cell Research', issns: ['1001-0602', '1748-7838'], impactFactor: 28.1 },
  { name: 'The EMBO Journal', issns: ['0261-4189', '1460-2075'], impactFactor: 9.4 },
  { name: 'EMBO Reports', issns: ['1469-221X', '1469-3178'], impactFactor: 6.5 },
  { name: 'Genes & Development', issns: ['0890-9369', '1549-5477'], impactFactor: 8.8 },
  { name: 'Molecular Systems Biology', issns: ['1744-4292'], impactFactor: 8.5 },
  { name: 'Trends in Biochemical Sciences', issns: ['0968-0004', '1362-4326'], impactFactor: 11.6 },

  // --- Chemistry / chemical biology / physics ---
  { name: 'Nature Chemistry', issns: ['1755-4330', '1755-4349'], impactFactor: 19.2 },
  { name: 'Nature Chemical Biology', issns: ['1552-4450', '1552-4469'], impactFactor: 12.9 },
  { name: 'Nature Physics', issns: ['1745-2473', '1745-2481'], impactFactor: 17.6 },
  { name: 'Physical Review Letters', issns: ['0031-9007', '1079-7114'], impactFactor: 8.1 },
  { name: 'Journal of the American Chemical Society', issns: ['0002-7863', '1520-5126'], impactFactor: 14.4 },
  { name: 'Angewandte Chemie International Edition', issns: ['1433-7851', '1521-3773'], impactFactor: 16.1 },

  // --- Structural / protein science ---
  { name: 'Nucleic Acids Research', issns: ['0305-1048', '1362-4962'], impactFactor: 14.9 },
  { name: 'Journal of Molecular Biology', issns: ['0022-2836', '1089-8638'], impactFactor: 5.6 },
  { name: 'Structure', issns: ['0969-2126', '1878-4186'], impactFactor: 4.6 },
  { name: 'Protein Science', issns: ['0961-8368', '1469-896X'], impactFactor: 5.4 },

  // --- Plant biology ---
  { name: 'The Plant Cell', issns: ['1040-4651', '1532-298X'], impactFactor: 10.0 },
  { name: 'Molecular Plant', issns: ['1674-2052', '1752-9867'], impactFactor: 17.1 },
  { name: 'New Phytologist', issns: ['0028-646X', '1469-8137'], impactFactor: 8.3 },
  { name: 'The Plant Journal', issns: ['0960-7412', '1365-313X'], impactFactor: 6.2 },
  { name: 'Plant Physiology', issns: ['0032-0889', '1532-2548'], impactFactor: 7.4 },
  { name: 'Journal of Experimental Botany', issns: ['0022-0957', '1460-2431'], impactFactor: 6.0 },
  { name: 'Plant Communications', issns: ['2590-3462'], impactFactor: 9.4 },
  { name: 'Nature Plants', issns: ['2055-0278'], impactFactor: 15.8 },
  { name: 'Trends in Plant Science', issns: ['1360-1385', '1878-4372'], impactFactor: 20.5 },
  { name: 'Annual Review of Plant Biology', issns: ['1543-5008', '1545-2123'], impactFactor: 22.5 },
  { name: 'Current Opinion in Plant Biology', issns: ['1369-5266', '1879-0356'], impactFactor: 8.3 },
  { name: 'Plant Biotechnology Journal', issns: ['1467-7644', '1467-7652'], impactFactor: 10.1 },
  { name: 'Journal of Integrative Plant Biology', issns: ['1672-9072', '1744-7909'], impactFactor: 9.3 },
  { name: 'Plant, Cell & Environment', issns: ['0140-7791', '1365-3040'], impactFactor: 6.0 },
  { name: 'Plant and Cell Physiology', issns: ['0032-0781', '1471-9053'], impactFactor: 4.4 },
  { name: 'Physiologia Plantarum', issns: ['0031-9317', '1399-3054'], impactFactor: 5.4 },
  { name: 'Plant Science', issns: ['0168-9452', '1873-2259'], impactFactor: 4.2 },
  { name: 'Horticulture Research', issns: ['2052-7276'], impactFactor: 8.7 },
  { name: 'BMC Plant Biology', issns: ['1471-2229'], impactFactor: 5.0 },
  { name: 'Frontiers in Plant Science', issns: ['1664-462X'], impactFactor: 4.1 },
]
