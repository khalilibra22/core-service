// permissions.ts

// TODO:  create teacher actions, academy actions , student actions and admin actions
export type Action =
  // Base CRUD
  | "create"
  | "read"
  | "update"
  | "delete"

  // Extended generic actions
  | "list" // read multiple items
  | "approve" // approve/reject requests
  | "assign" // assign resources
  | "upload" // upload files/videos
  | "download" // download files
  | "publish" // make resource public
  | "unpublish" // hide resource
  | "ban" // disable user/resource
  | "unban" // re-enable user/resource
  | "manage" // broad admin action
  | "invite" // invite other users
  | "export" // export data
  | "import" // import data

  // Coupon-specific actions
  | "use" // redeem/apply coupon
  | "activate" // enable coupon
  | "deactivate" // disable coupon
  | "subscribe"
  | "cancel"
  | "pick"
  | "toggle"
  | "adjust"
  | "drop"
  | "view"
  | "resolve"
  | "respond"
  | "overview";

export type Resource =
  | "enrollments"
  | "courses"
  | "sessions"
  | "reviews"
  | "complaints"
  | "payments";
