# NDPR Compliance Procedures for ML Systems

**Document Type:** Operational Procedures  
**Version:** 1.0  
**Date:** February 6, 2026  
**Owner:** Compliance Officer  
**Review Cycle:** Annual

---

## Executive Summary

This document establishes detailed procedures for ensuring compliance with the Nigeria Data Protection Regulation (NDPR) 2019 in all machine learning systems deployed by KOMPLEET. The procedures cover lawful data processing, consent management, data subject rights, privacy impact assessments, and regulatory reporting. All personnel involved in ML development, deployment, or data processing must follow these procedures to maintain NDPR compliance and avoid regulatory penalties.

---

## 1. Legal Framework Overview

### 1.1 NDPR 2019

The Nigeria Data Protection Regulation 2019, issued by the National Information Technology Development Agency (NITDA), establishes comprehensive requirements for the processing of personal data in Nigeria. The regulation applies to all organizations processing personal data of Nigerian residents, regardless of where the organization is located. NDPR is enforced by the Nigeria Data Protection Commission (NDPC), which has authority to conduct inspections, investigate complaints, and impose penalties for violations.

### 1.2 Key Definitions

**Personal Data** means any information relating to an identified or identifiable natural person (data subject). This includes names, identification numbers, location data, online identifiers, and factors specific to physical, physiological, genetic, mental, economic, cultural, or social identity.

**Processing** means any operation performed on personal data, including collection, recording, organization, structuring, storage, adaptation, retrieval, consultation, use, disclosure, dissemination, restriction, erasure, or destruction.

**Data Controller** is the entity that determines the purposes and means of processing personal data. KOMPLEET acts as data controller for ML systems processing user data.

**Data Processor** is an entity that processes personal data on behalf of the data controller. Third-party service providers may act as data processors for KOMPLEET.

**Consent** means any freely given, specific, informed, and unambiguous indication of the data subject's wishes by which they signify agreement to the processing of personal data relating to them.

### 1.3 NDPR Principles

NDPR establishes seven core principles that must guide all data processing activities. **Lawfulness, Fairness, and Transparency** requires processing to have a lawful basis, be conducted fairly, and be transparent to data subjects. **Purpose Limitation** mandates that data be collected for specified, explicit, and legitimate purposes and not further processed in a manner incompatible with those purposes. **Data Minimization** requires that data collected be adequate, relevant, and limited to what is necessary for the purposes. **Accuracy** obligates controllers to ensure personal data is accurate and kept up to date. **Storage Limitation** limits retention to no longer than necessary for the purposes. **Integrity and Confidentiality** requires appropriate security measures to protect against unauthorized processing, loss, or damage. **Accountability** makes controllers responsible for demonstrating compliance with all principles.

---

## 2. Lawful Basis for Processing

### 2.1 Identifying Lawful Basis

Before processing personal data for ML purposes, the Compliance Officer must identify and document the lawful basis. NDPR provides six lawful bases for processing. **Consent** applies when the data subject has given clear consent for processing for specific purposes. **Contract** applies when processing is necessary for performing a contract with the data subject or taking steps at their request before entering a contract. **Legal Obligation** applies when processing is necessary to comply with a legal obligation. **Vital Interests** applies when processing is necessary to protect the vital interests (life or death) of the data subject or another person. **Public Task** applies when processing is necessary for performing a task in the public interest or in the exercise of official authority. **Legitimate Interests** applies when processing is necessary for legitimate interests pursued by the controller or a third party, except where overridden by the interests or fundamental rights and freedoms of the data subject.

### 2.2 Documenting Lawful Basis

For each ML model processing personal data, the Model Owner must complete a Lawful Basis Assessment documenting the model name and version, data categories processed, processing purposes, lawful basis selected, justification for lawful basis selection, and evidence supporting the lawful basis (consent records, contracts, legal requirements). The assessment must be reviewed and approved by the Compliance Officer before model deployment and stored in the Model Registry.

### 2.3 Consent Management

When consent is the lawful basis, KOMPLEET must obtain valid consent meeting NDPR requirements. Valid consent must be freely given (no coercion or significant imbalance of power), specific (separate consent for different processing purposes), informed (clear information about purposes, data used, and consequences), and unambiguous (clear affirmative action, not silence or pre-ticked boxes). Consent requests must be clearly distinguishable from other matters, presented in clear and plain language, include the right to withdraw consent at any time, and specify the data controller's identity.

### 2.4 Consent Records

All consent must be documented and retained as evidence of compliance. Consent records must include the data subject's identity, date and time consent was given, information provided to the data subject, method of consent (checkbox, signature, verbal), specific purposes consented to, and any subsequent consent withdrawals. Consent records must be stored securely with access restricted to authorized personnel and retained for seven years after consent is withdrawn or the relationship ends.

---

## 3. Data Minimization and Purpose Limitation

### 3.1 Data Minimization Assessment

Before collecting data for ML training, the Model Owner must conduct a Data Minimization Assessment to ensure only necessary data is collected. The assessment must identify the model's purpose and success criteria, list all data elements proposed for collection, justify why each data element is necessary for the purpose, identify any data elements that could be eliminated or anonymized, and document the assessment outcome and Compliance Officer approval.

### 3.2 Purpose Specification

The purpose for which personal data is collected must be specified clearly and documented in the Model Registry. Purpose specifications must be specific (not vague or open-ended), explicit (clearly stated, not implied), and legitimate (lawful and not contrary to public policy). Examples of valid purpose specifications include "to categorize financial transactions for tax compliance purposes" or "to detect recurring payment patterns for user convenience." Invalid purpose specifications include "for business purposes" or "to improve our services."

### 3.3 Purpose Limitation Enforcement

Personal data collected for one purpose must not be repurposed for materially different purposes without additional lawful basis. Before repurposing data, the Compliance Officer must assess whether the new purpose is compatible with the original purpose, considering the relationship between purposes, context of collection, nature of personal data, possible consequences for data subjects, and existence of appropriate safeguards. If purposes are incompatible, new lawful basis (typically consent) must be obtained before repurposing.

---

## 4. Data Subject Rights

### 4.1 Right to Access

Data subjects have the right to obtain confirmation of whether their personal data is being processed, access to their personal data, and information about the processing including purposes, categories of data, recipients, retention period, and rights available. KOMPLEET must respond to access requests within 30 days by verifying the requester's identity, locating all personal data held about the data subject (including training datasets and model predictions), preparing a clear summary of processing activities, and providing the information in a commonly used electronic format.

### 4.2 Right to Rectification

Data subjects have the right to have inaccurate personal data corrected and incomplete personal data completed. When a rectification request is received, KOMPLEET must verify the requester's identity, assess whether the data is indeed inaccurate or incomplete, correct the data in all systems (including databases, backups, and training datasets), notify any third parties to whom the data was disclosed, and respond to the requester within 30 days. If rectification affects ML model training data, the Model Owner must assess whether model retraining is necessary to maintain accuracy and fairness.

### 4.3 Right to Erasure

Data subjects have the right to have their personal data erased in certain circumstances including when the data is no longer necessary for the purposes, consent is withdrawn and there is no other lawful basis, the data subject objects and there are no overriding legitimate grounds, the data was unlawfully processed, or erasure is required by legal obligation. When an erasure request is received, KOMPLEET must verify the requester's identity, assess whether erasure is required or an exception applies, delete the data from all systems (including backups and training datasets), notify any third parties to whom the data was disclosed, and respond to the requester within 30 days. If erasure affects ML model training data, the Model Owner must assess whether model retraining is necessary and whether the model can still be used lawfully.

### 4.4 Right to Restriction

Data subjects have the right to restrict processing in certain circumstances including when accuracy is contested, processing is unlawful but the data subject opposes erasure, the data is no longer needed but required by the data subject for legal claims, or the data subject has objected pending verification of legitimate grounds. When a restriction request is received, KOMPLEET must verify the requester's identity, assess whether restriction is required, implement the restriction (typically by marking data as restricted and preventing further processing except storage), notify any third parties to whom the data was disclosed, and respond to the requester within 30 days. Restricted data must not be used for ML training or inference until the restriction is lifted.

### 4.5 Right to Object

Data subjects have the right to object to processing based on legitimate interests or for direct marketing purposes. When an objection is received, KOMPLEET must verify the requester's identity, assess whether there are compelling legitimate grounds that override the data subject's interests, cease processing if no overriding grounds exist, and respond to the requester within 30 days. If the objection affects ML model processing, the Model Owner must assess whether the model can continue to operate without the data subject's data or whether alternative lawful basis exists.

### 4.6 Right to Human Review

Data subjects have the right not to be subject to decisions based solely on automated processing (including profiling) that produce legal effects or similarly significantly affect them, unless the decision is necessary for a contract, authorized by law, or based on explicit consent. When automated decisions are made, KOMPLEET must provide meaningful information about the logic involved, the significance and envisaged consequences, and the right to obtain human intervention, express their point of view, and contest the decision. Model Owners must document which models make automated decisions and ensure human review procedures are available.

### 4.7 Data Subject Rights Request Procedure

All data subject rights requests must be logged in the Data Subject Rights Request System with a unique request ID, requester information, request type, date received, and assigned handler. The Compliance Officer must verify the requester's identity using appropriate means (government ID, account verification), assess the request validity and any applicable exceptions, coordinate with relevant teams (Model Owners, Platform Engineers, Legal) to fulfill the request, respond to the requester within 30 days with the outcome, and document the request handling in the audit log. If the request cannot be fulfilled within 30 days due to complexity, the Compliance Officer may extend the period by two additional months with notification to the requester.

---

## 5. Privacy Impact Assessments

### 5.1 When PIA is Required

A Privacy Impact Assessment (PIA) must be conducted when ML processing is likely to result in high risk to the rights and freedoms of data subjects. High-risk processing includes systematic and extensive evaluation or scoring based on automated processing (including profiling), large-scale processing of sensitive personal data categories (health, financial, biometric, genetic), systematic monitoring of publicly accessible areas on a large scale, processing that involves new technologies or novel applications, and processing that may result in significant decisions affecting individuals (credit, employment, access to services).

### 5.2 PIA Process

The Model Owner initiates the PIA by completing the PIA Trigger Assessment to determine if a PIA is required. If required, the Model Owner prepares the PIA document in consultation with the Compliance Officer, documenting the systematic description of processing operations and purposes, assessment of necessity and proportionality of processing, assessment of risks to data subject rights and freedoms, measures to address risks and demonstrate compliance, and stakeholder consultation (including data subjects if appropriate). The Compliance Officer reviews and approves the PIA, and the PIA is stored in the Model Registry and made available for regulatory inspection.

### 5.3 PIA Content Requirements

The PIA document must include a description of the ML model and its purpose, categories of personal data processed, data sources and collection methods, data retention periods, data sharing with third parties, lawful basis for processing, data subject rights procedures, assessment of necessity (why this processing is necessary), assessment of proportionality (whether less intrusive alternatives exist), risk identification (what could go wrong), risk assessment (likelihood and severity), risk mitigation measures (technical and organizational controls), residual risk assessment (remaining risk after mitigation), and approval and sign-off by the Compliance Officer.

### 5.4 PIA Review and Updates

PIAs must be reviewed annually or when material changes occur to the processing operations. Material changes include significant changes to data categories processed, changes to processing purposes, changes to data retention periods, changes to third-party data sharing, deployment of new model versions with different characteristics, or changes to risk profile. The Model Owner is responsible for identifying when PIA updates are required and coordinating with the Compliance Officer to complete the updates.

---

## 6. Data Processing Agreements

### 6.1 When DPA is Required

A Data Processing Agreement (DPA) must be executed before engaging any third-party processor to process personal data on behalf of KOMPLEET. This includes cloud service providers hosting ML infrastructure, third-party ML platforms or APIs, data annotation or labeling services, and any other service providers with access to personal data. The DPA establishes the processor's obligations and KOMPLEET's rights as data controller.

### 6.2 DPA Content Requirements

The DPA must specify the subject matter and duration of processing, nature and purpose of processing, types of personal data and categories of data subjects, and obligations and rights of the data controller. The processor must commit to process data only on documented instructions from the controller, ensure personnel processing data are subject to confidentiality obligations, implement appropriate technical and organizational security measures, engage sub-processors only with prior written authorization, assist the controller in responding to data subject rights requests, assist the controller in ensuring compliance with security and breach notification obligations, delete or return all personal data at the end of services (at controller's choice), and make available all information necessary to demonstrate compliance and allow audits.

### 6.3 DPA Management

The Compliance Officer maintains a register of all data processors and executed DPAs. The register includes the processor name and contact information, services provided, data categories processed, DPA execution date and term, sub-processors authorized, and audit/assessment schedule. The Compliance Officer conducts annual reviews of processor compliance through questionnaires, audits, or certifications (ISO 27001, SOC 2).

---

## 7. Security Measures

### 7.1 Security Requirements

KOMPLEET must implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk of processing. Technical measures include encryption of personal data at rest and in transit, pseudonymization or anonymization where possible, access controls restricting data access to authorized personnel only, regular security testing (penetration testing, vulnerability assessments), secure backup and disaster recovery procedures, and audit logging of all data access and processing activities. Organizational measures include security policies and procedures, personnel security (background checks, confidentiality agreements), security awareness training, incident response procedures, and vendor security assessments.

### 7.2 Security Assessment

Before deploying an ML model processing personal data, the Security Reviewer must conduct a Security Assessment documenting the data categories processed and sensitivity level, security controls implemented (encryption, access controls, monitoring), residual security risks, and approval for deployment. The assessment must be stored in the Model Registry and reviewed annually or when material changes occur.

---

## 8. Data Breach Notification

### 8.1 Breach Definition

A personal data breach is a breach of security leading to accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to personal data. This includes unauthorized access to ML model training data or inference data, accidental disclosure of personal data through model outputs, loss of data due to system failures or disasters, and ransomware or other attacks affecting personal data.

### 8.2 Breach Detection and Assessment

When a potential breach is detected, the Compliance Officer must immediately assess whether a personal data breach has occurred, determine the categories and approximate number of data subjects affected, determine the categories and approximate number of personal data records affected, assess the likely consequences for data subjects, and determine whether notification to NDPC and/or data subjects is required.

### 8.3 Notification to NDPC

If the breach is likely to result in a risk to the rights and freedoms of data subjects, KOMPLEET must notify the NDPC within 72 hours of becoming aware of the breach. The notification must include the nature of the breach (categories of data, approximate number of data subjects affected), name and contact details of the Data Protection Officer or other contact point, description of likely consequences of the breach, and description of measures taken or proposed to address the breach and mitigate its possible adverse effects. If notification cannot be provided within 72 hours, the notification must state the reasons for the delay and provide information in phases as it becomes available.

### 8.4 Notification to Data Subjects

If the breach is likely to result in a high risk to the rights and freedoms of data subjects, KOMPLEET must notify affected data subjects without undue delay. The notification must be in clear and plain language and include the nature of the breach, name and contact details of the Data Protection Officer or other contact point, description of likely consequences of the breach, and description of measures taken or proposed to address the breach and mitigate its possible adverse effects. Notification to data subjects is not required if the data was encrypted or otherwise rendered unintelligible, measures have been taken to ensure the high risk is no longer likely to materialize, or notification would involve disproportionate effort (in which case public communication is acceptable).

### 8.5 Breach Documentation

All personal data breaches must be documented regardless of whether notification is required. The breach record must include the facts of the breach, its effects, and remedial action taken. Breach records must be maintained for seven years and made available to the NDPC upon request.

---

## 9. Transparency and User Communication

### 9.1 Privacy Notice Requirements

KOMPLEET must provide clear and transparent information to data subjects about personal data processing. Privacy notices must be provided at the time of data collection and include the identity and contact details of the data controller, contact details of the Data Protection Officer (if applicable), purposes of processing and lawful basis, legitimate interests pursued (if applicable), recipients or categories of recipients of personal data, intention to transfer data outside Nigeria (if applicable), retention period or criteria for determining retention, existence of data subject rights (access, rectification, erasure, restriction, objection), right to withdraw consent (if applicable), right to lodge a complaint with NDPC, whether providing data is a statutory or contractual requirement, and existence of automated decision-making including profiling.

### 9.2 Model Transparency

For ML models making decisions affecting data subjects, additional transparency must be provided including a description of the model's purpose and how it works (in plain language), information about the data used to train the model, explanation of how decisions are made (logic involved), information about the accuracy and limitations of the model, and contact information for questions or complaints. This information should be provided through in-app help text, FAQ pages, or dedicated transparency pages.

### 9.3 Explainability Procedures

When data subjects request explanations of automated decisions, the Model Owner must provide meaningful information about the logic involved, the significance and envisaged consequences of the processing, and the specific factors that influenced the decision in the data subject's case. Explanations must be in plain language understandable to a non-technical audience and provided within 30 days of the request.

---

## 10. Training and Awareness

### 10.1 Mandatory Training

All personnel involved in processing personal data for ML purposes must complete NDPR compliance training within 30 days of assuming their role. Training must cover NDPR principles and requirements, lawful basis for processing, data subject rights and procedures, security requirements, breach notification procedures, and role-specific responsibilities. Annual refresher training is required to maintain awareness of regulatory changes and organizational procedures.

### 10.2 Training Records

Training completion must be documented and tracked in the HR system. The Compliance Officer maintains records of training attendance, completion dates, and assessment results. Non-compliance with training requirements may result in loss of access to personal data systems.

---

## 11. Compliance Monitoring and Reporting

### 11.1 Compliance Monitoring

The Compliance Officer conducts quarterly compliance reviews to assess adherence to NDPR requirements. Reviews include verification that all models have documented lawful basis, consent records are complete and valid, data subject rights requests are handled within required timeframes, PIAs are completed for high-risk processing, DPAs are executed with all processors, security measures are implemented and effective, and breach notification procedures are operational.

### 11.2 Compliance Reporting

The Compliance Officer prepares quarterly compliance reports for executive leadership covering models processing personal data, lawful basis for each model, data subject rights requests received and handled, PIAs completed, data breaches and notifications, compliance gaps and remediation plans, and regulatory developments affecting KOMPLEET.

### 11.3 Regulatory Reporting

KOMPLEET must submit annual compliance reports to the NDPC as required by regulation. Reports must include a description of data processing activities, categories of personal data processed, purposes of processing, data subject rights procedures, security measures implemented, data breaches that occurred, and any changes to processing activities during the year.

---

## 12. Compliance Checklist

Organizations should use this checklist to verify NDPR compliance before deploying ML models processing personal data.

### Lawful Basis
- [ ] Lawful basis identified and documented
- [ ] Justification for lawful basis provided
- [ ] Consent obtained and recorded (if applicable)
- [ ] Lawful Basis Assessment approved by Compliance Officer

### Data Minimization
- [ ] Data Minimization Assessment completed
- [ ] Only necessary data collected
- [ ] Purpose clearly specified and documented
- [ ] Purpose limitation enforced

### Data Subject Rights
- [ ] Access request procedures documented
- [ ] Rectification procedures documented
- [ ] Erasure procedures documented
- [ ] Restriction procedures documented
- [ ] Objection procedures documented
- [ ] Human review procedures documented (if automated decisions)

### Privacy Impact Assessment
- [ ] PIA trigger assessment completed
- [ ] PIA completed (if required)
- [ ] Risks identified and mitigated
- [ ] PIA approved by Compliance Officer

### Security
- [ ] Security Assessment completed
- [ ] Encryption implemented
- [ ] Access controls configured
- [ ] Audit logging enabled
- [ ] Security testing conducted

### Transparency
- [ ] Privacy notice provided to data subjects
- [ ] Model transparency information available
- [ ] Explainability procedures documented

### Data Processing Agreements
- [ ] DPAs executed with all processors
- [ ] Processor compliance verified

### Training
- [ ] All personnel completed NDPR training
- [ ] Training records maintained

---

## Conclusion

Compliance with NDPR is essential for lawful operation of ML systems processing personal data in Nigeria. By following these procedures, KOMPLEET can ensure responsible data processing, protect data subject rights, maintain regulatory compliance, and build trust with users and regulators.

---

**Document Version:** 1.0  
**Last Updated:** February 6, 2026  
**Next Review:** February 6, 2027

*These procedures are part of the KOMPLEET ML Governance framework and must be followed for all ML systems processing personal data.*
