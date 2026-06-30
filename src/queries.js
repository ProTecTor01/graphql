export const DASHBOARD_QUERY = `
  query DashboardData($txLimit: Int!, $resultLimit: Int!, $progressLimit: Int!) {
    user {
      id
      login
    }
    transaction(limit: $txLimit, order_by: { createdAt: asc }) {
      id
      type
      amount
      objectId
      userId
      createdAt
      path
    }
    result(limit: $resultLimit, order_by: { updatedAt: desc }) {
      id
      objectId
      userId
      grade
      type
      createdAt
      updatedAt
      path
      user {
        id
        login
      }
    }
    progress(limit: $progressLimit, order_by: { updatedAt: desc }) {
      id
      userId
      objectId
      grade
      createdAt
      updatedAt
      path
    }
  }
`;

export const DASHBOARD_QUERY_WITH_EVENT_ID = `
  query DashboardData($txLimit: Int!, $resultLimit: Int!, $progressLimit: Int!) {
    user {
      id
      login
    }
    transaction(limit: $txLimit, order_by: { createdAt: asc }) {
      id
      type
      amount
      objectId
      userId
      eventId
      createdAt
      path
    }
    result(limit: $resultLimit, order_by: { updatedAt: desc }) {
      id
      objectId
      userId
      grade
      type
      createdAt
      updatedAt
      path
      user {
        id
        login
      }
    }
    progress(limit: $progressLimit, order_by: { updatedAt: desc }) {
      id
      userId
      objectId
      grade
      createdAt
      updatedAt
      path
    }
  }
`;

export const OBJECT_QUERY = `
  query ObjectLookup($ids: [Int!]!) {
    object(where: { id: { _in: $ids } }) {
      id
      name
      type
      attrs
    }
  }
`;
