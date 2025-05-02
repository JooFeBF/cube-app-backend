-- Down Migration
DELETE FROM modalities WHERE modality_id IN (
    '2x2', '3x3', '4x4', '5x5', '6x6', '7x7',
    'pyra', 'mega', 'skewb', 'sq1', 'clock'
);
