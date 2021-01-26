import {insertOrgUserAuditQuery} from '../queries/generated/insertOrgUserAuditQuery'
import getPG from '../getPG'
import OrgUserAuditEventTypeEnum from '../types/OrgUserAuditEventTypeEnum'

const insertOrgUserAudit = async (
  orgIds: string[],
  userId: string,
  eventType: OrgUserAuditEventTypeEnum,
  eventDate: Date = new Date()
) => {
  const pgPool = getPG()
  const auditRows = orgIds.map((orgId) => ({orgId, userId, eventType, eventDate}))
  const parameters = {auditRows}
  await insertOrgUserAuditQuery.run(parameters, pgPool)
}

export default insertOrgUserAudit
