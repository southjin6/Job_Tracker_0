-- Job_Tracker demo/seed data — safe to re-run only on an EMPTY schema.
USE job_tracker;

INSERT INTO companies (id, name, industry, website, company_size, notes) VALUES
(1, 'Acme BPO Solutions', 'BPO / IT Services', 'https://acmebpo.example.ph', '~5000', 'Recruitment hub in Eastwood. Walk-ins accepted Tue/Thu.'),
(2, 'Pacific Data Systems', 'IT / Data Services', NULL, '50-200', 'Local company, referral from cousin. No online postings.'),
(3, 'StarHub Telecom Services', 'Telecom / Service Desk', 'https://starhub.example.ph', '~10000', 'Service desk roles via portal only.');

INSERT INTO company_branches (id, company_id, label, address_line, city, province, region, postal_code, is_primary) VALUES
(1, 1, 'HQ Eastwood', '6th Floor, Cyber Fashion Tower, Eastwood City', 'Quezon City', 'Metro Manila', 'NCR', '1110', 1),
(2, 1, 'Cebu IT Park', 'Innerspace Building, Cebu IT Park', 'Cebu City', 'Cebu', 'Region VII', '6000', 0),
(3, 2, 'Main Office', '123 F. Ortigas Jr. Road', 'Pasig City', 'Metro Manila', 'NCR', '1605', 1),
(4, 3, 'HQ BGC', 'One Bonifacio High Street', 'Taguig City', 'Metro Manila', 'NCR', '1634', 1);

INSERT INTO contact_persons (id, company_id, branch_id, full_name, job_title, email, phone, preferred_channel, is_primary) VALUES
(1, 1, 1, 'Ma. Santos', 'Talent Acquisition Specialist', 'hr@acmebpo.example.ph', '+63 917 555 0101', 'email', 1),
(2, 2, 3, 'Rico Dela Cruz', 'Operations Manager', 'rico@pacificdata.example.ph', '+63 918 555 0202', 'call', 1),
(3, 3, 4, 'Jasmine Lim', 'Recruiter', 'jasmine.lim@starhub.example.ph', NULL, 'email', 0);

-- Applications across pipeline stages
INSERT INTO applications (id, company_id, branch_id, job_title, role_category, source, status, applied_at, priority, notes) VALUES
(1, 1, 1, 'IT Support Associate', 'it', 'walk-in', 'assessment', '2026-09-08', 1, 'Walked in during job fair; got BUPLAS schedule same day.'),
(2, 2, 3, 'Data Encoder', 'data', 'referral', 'interview', '2026-09-02', 1, 'Referred by cousin. Panel interview next week.'),
(3, 3, 4, 'Service Desk Analyst', 'service_desk', 'JobStreet', 'submitted', '2026-09-15', 2, NULL),
(4, 1, 2, 'Technical Support Representative', 'it', 'walk-in', 'rejected', '2026-08-20', 3, 'Failed technical exam, can reapply after 6 months.'),
(5, 3, 4, 'Junior Data Analyst', 'data', 'portal', 'offer', '2026-08-25', 1, 'Offer verbal, waiting for written contract.');

-- Status history must be consistent with current status
INSERT INTO application_status_history (application_id, old_status, new_status, note, changed_at) VALUES
(1, NULL, 'submitted', 'Initial log', '2026-09-08 10:15:00'),
(1, 'submitted', 'assessment', 'BUPLAS + technical scheduled', '2026-09-09 14:00:00'),
(2, NULL, 'submitted', 'Initial log', '2026-09-02 09:00:00'),
(2, 'submitted', 'interview', 'Rico called, set panel interview', '2026-09-12 16:30:00'),
(3, NULL, 'submitted', 'Initial log', '2026-09-15 11:00:00'),
(4, NULL, 'submitted', 'Initial log', '2026-08-20 10:00:00'),
(4, 'submitted', 'assessment', 'Onsite technical exam', '2026-08-25 13:00:00'),
(4, 'assessment', 'rejected', 'Failed technical exam', '2026-09-01 09:30:00'),
(5, NULL, 'submitted', 'Initial log', '2026-08-25 15:00:00'),
(5, 'submitted', 'interview', 'HR interview', '2026-08-29 10:00:00'),
(5, 'interview', 'offer', 'Verbal offer', '2026-09-18 17:00:00');

INSERT INTO submissions (application_id, contact_person_id, channel, destination, submitted_at, confirmation_ref, attachment_name) VALUES
(1, NULL, 'walk_in', 'Walked in at Eastwood job fair booth, gave resume to Ma. Santos', '2026-09-08 10:15:00', NULL, 'Resume_IT_v3.pdf'),
(2, 2, 'email', 'rico@pacificdata.example.ph', '2026-09-02 09:00:00', NULL, 'Resume_Data_v2.pdf'),
(3, NULL, 'job_board', 'https://jobstreet.example.ph/job/123456', '2026-09-15 11:00:00', 'JS-998877', 'Resume_SD_v1.pdf'),
(4, NULL, 'walk_in', 'Cebu IT Park branch reception', '2026-08-20 10:00:00', NULL, 'Resume_IT_v2.pdf'),
(5, 3, 'portal', 'https://careers.starhub.example.ph/apply/789', '2026-08-25 15:00:00', 'Application ID: 458821', 'Resume_Data_v2.pdf'),
(5, 3, 'email', 'jasmine.lim@starhub.example.ph', '2026-08-26 08:45:00', NULL, 'Resume_Data_v2.pdf');

INSERT INTO assessments (application_id, type, name, status, location, scheduled_at, completed_at, score, max_score, result_notes) VALUES
(1, 'buplas', 'BUPLAS English Proficiency', 'passed', 'Acme Eastwood assessment room', '2026-09-10 09:00:00', '2026-09-10 10:30:00', 124, 150, 'Passed, 124/150.'),
(1, 'technical', 'IT troubleshooting situational exam', 'scheduled', 'Acme Eastwood assessment room', '2026-09-24 09:00:00', NULL, NULL, NULL, NULL),
(4, 'technical', 'TSR technical exam', 'failed', 'Acme Cebu IT Park', '2026-08-25 13:00:00', '2026-08-25 15:00:00', 48, 100, 'Score 48/100, passing is 70.'),
(5, 'skills_test', 'Excel/SQL case study', 'passed', 'https://tests.starhub.example.ph/case/789', '2026-09-01 14:00:00', '2026-09-01 15:20:00', 88, 100, NULL);

INSERT INTO communications (application_id, contact_person_id, method, direction, summary, details, occurred_at, follow_up_due_at, follow_up_completed_at) VALUES
(1, 1, 'sms', 'inbound', 'HR texted BUPLAS result: passed', NULL, '2026-09-11 15:20:00', NULL, NULL),
(2, 2, 'call', 'inbound', 'Rico called: panel interview Sep 25, 10am', 'Bring 2 valid IDs and printed resume', '2026-09-12 16:30:00', '2026-09-24 09:00:00', NULL),
(3, NULL, 'note', 'outbound', 'No response yet from JobStreet application', 'If nothing by Sep 29, email recruiter directly', '2026-09-19 08:00:00', '2026-09-20 09:00:00', NULL),
(5, 3, 'email', 'inbound', 'Verbal offer details: 18k/mo, start Oct 6', 'Asked to confirm acceptance by Sep 26', '2026-09-18 17:00:00', '2026-09-26 12:00:00', NULL),
(5, 3, 'call', 'outbound', 'Called to confirm receipt of offer email', NULL, '2026-09-19 10:15:00', NULL, NULL),
(4, NULL, 'note', 'outbound', 'Reapplication window opens Feb 2027', NULL, '2026-09-01 10:00:00', NULL, NULL);
