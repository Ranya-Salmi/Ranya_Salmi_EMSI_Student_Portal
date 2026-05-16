ALTER TABLE public.alertes
ADD COLUMN IF NOT EXISTS score_risque INTEGER;

UPDATE public.alertes
SET score_risque = 90
WHERE type = 'absence' AND urgence = 'critical' AND score_risque IS NULL;

UPDATE public.alertes
SET score_risque = 70
WHERE type = 'absence' AND urgence = 'warning' AND score_risque IS NULL;

UPDATE public.alertes
SET score_risque = 60
WHERE type = 'note' AND urgence = 'warning' AND score_risque IS NULL;

UPDATE public.alertes
SET score_risque = CAST(
    substring(message from '([0-9]+)\/100') AS INTEGER
)
WHERE type = 'risque_ia'
  AND score_risque IS NULL
  AND message ~ '[0-9]+\/100';