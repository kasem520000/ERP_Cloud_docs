-- Seeds: 6 treatments + 10 jurisdictions + rates (REQUIRES_VERIFICATION, verified_at NULL)
INSERT INTO tax_treatments (key, name, name_ar, description, gl_effect) VALUES
('STANDARD_RATED','Standard Rated','خاضع قياسي','Standard VAT','VAT_PAYABLE'),
('ZERO_RATED','Zero Rated','صفرية','0% but reported distinct from exempt','VAT_PAYABLE_ZERO'),
('EXEMPT','Exempt','معفاة','Exempt supply no credit','NO_GL'),
('OUT_OF_SCOPE','Out of Scope','خارج النطاق','Outside VAT scope','NO_GL'),
('REVERSE_CHARGE','Reverse Charge','احتساب عكسي','Reverse charge mechanism','VAT_PAYABLE/RECOVERABLE'),
('NOT_SUBJECT','Not Subject','غير خاضع','Not registered or NO_VAT','NO_GL')
ON CONFLICT (key) DO NOTHING;

INSERT INTO jurisdictions (country_code, name, name_ar, vat_status, pack_version, regulatory_notes, official_source) VALUES
('SA','Saudi Arabia','السعودية','VAT_IN_FORCE','1.0.0','ZATCA VAT 15% standard','https://zatca.gov.sa'),
('AE','United Arab Emirates','الإمارات','VAT_IN_FORCE','1.0.0','FTA VAT 5%','https://tax.gov.ae'),
('BH','Bahrain','البحرين','VAT_IN_FORCE','1.0.0','NBR VAT 10% since 2022','https://nbr.gov.bh'),
('KW','Kuwait','الكويت','NO_VAT','1.0.0','No VAT regime','https://moc.gov.kw'),
('OM','Oman','عمان','VAT_IN_FORCE','1.0.0','Oman VAT 5%','https://taxoman.gov.om'),
('QA','Qatar','قطر','VAT_PLANNED','1.0.0','VAT planned, not in force','https://gta.gov.qa'),
('YE','Yemen','اليمن','NO_VAT','1.0.0','No VAT','https://yemen-tax.gov.ye'),
('EG','Egypt','مصر','VAT_IN_FORCE','1.0.0','Egypt VAT 14% standard','https://eta.gov.eg'),
('JO','Jordan','الأردن','VAT_IN_FORCE','1.0.0','JOR GST 16% modelled as VAT (ضريبة المبيعات)','https://istd.gov.jo'),
('IQ','Iraq','العراق','NO_VAT','1.0.0','No VAT','https://iraq-tax.gov.iq')
ON CONFLICT (country_code) DO NOTHING;

-- SA rates history: 5% pre 2020-07-01, 15% after
INSERT INTO jurisdiction_tax_rates (id, country_code, treatment, rate, effective_from, effective_to, source_ref, verified_at) VALUES
(gen_random_uuid(),'SA','STANDARD_RATED',0.05,'2020-01-01','2020-06-30','zatca.gov.sa VAT law',NULL),
(gen_random_uuid(),'SA','STANDARD_RATED',0.15,'2020-07-01',NULL,'zatca.gov.sa amendment',NULL),
(gen_random_uuid(),'SA','ZERO_RATED',0.00,'2020-01-01',NULL,'zatca.gov.sa',NULL),
(gen_random_uuid(),'AE','STANDARD_RATED',0.05,'2018-01-01',NULL,'tax.gov.ae',NULL),
(gen_random_uuid(),'BH','STANDARD_RATED',0.10,'2022-01-01',NULL,'nbr.gov.bh',NULL),
(gen_random_uuid(),'OM','STANDARD_RATED',0.05,'2021-04-16',NULL,'taxoman.gov.om',NULL),
(gen_random_uuid(),'EG','STANDARD_RATED',0.14,'2016-09-08',NULL,'eta.gov.eg',NULL),
(gen_random_uuid(),'JO','STANDARD_RATED',0.16,'2016-01-01',NULL,'istd.gov.jo',NULL)
ON CONFLICT DO NOTHING;
-- QA/KW/YE/IQ NO_VAT packs have zero-rate rows but no VAT postings
