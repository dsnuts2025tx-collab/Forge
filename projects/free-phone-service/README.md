# Free Phone Service

## Mission
Build a production-ready platform for a $0/month basic phone service for customers, using participating terrestrial cellular networks as the primary connectivity layer and compatible satellite connectivity as fallback where available.

## Technical truth
The customer price is $0; underlying carrier, satellite, spectrum, device, regulatory, emergency-service, and operational costs are not assumed to be zero. The platform must support a sustainable funding/revenue model and must never falsely claim that unlimited cellular or satellite access is already free.

## Architecture goals
- Network abstraction layer for participating cellular providers.
- Satellite fallback abstraction for compatible devices/networks.
- Automatic connectivity selection and health/status reporting.
- eSIM/SIM provisioning workflow interfaces.
- Customer eligibility and service entitlement management.
- Usage metering and cost accounting.
- Funding/revenue accounting sufficient to prove how $0 customer service is financed.
- Emergency-connectivity priority handling.
- Provider integration interfaces with no hard dependency on a single carrier.
- Audit logs and operational controls.
- Customer portal and operator/admin portal.

## MVP boundary
The first build must be an honest, deployable control plane and customer experience. Real carrier and satellite connectivity requires contracts, credentials, approved devices, and regulatory/commercial integration; those dependencies are represented as integration interfaces until they are legitimately connected.

## Success condition
A customer can understand, enroll in, and monitor a $0 basic service entitlement, while operators can see network availability, partner economics, usage, funding coverage, and integration status from one system.
