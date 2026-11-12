-- Enforce exactly one OCR attempt per uploaded Scanner image.
-- Existing completed jobs remain completed; in-flight/failed jobs are not granted retries.
update public.plato_id_scanner_ocr_jobs
   set max_attempts = 1,
       updated_at = now()
 where max_attempts <> 1;

alter table public.plato_id_scanner_ocr_jobs
  alter column max_attempts set default 1;

alter table public.plato_id_scanner_ocr_jobs
  drop constraint if exists plato_id_scanner_ocr_jobs_max_attempts_check;

alter table public.plato_id_scanner_ocr_jobs
  add constraint plato_id_scanner_ocr_jobs_max_attempts_check
  check (max_attempts = 1);
