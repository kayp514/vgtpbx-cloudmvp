import type {
    auth_user,
    auth_user_mapping,
    domain_mapping,
    auth_tenant, 
    pbx_access_controls,
    pbx_access_control_nodes,
    pbx_extensions,
    pbx_extension_users,
    pbx_domains,
    pbx_domain_settings,
    pbx_email_templates,
    pbx_gateways,
    pbx_bridges,
    pbx_modules,
    pbx_vars,
    pbx_sip_profiles,
    pbx_sip_profile_domains,
    pbx_sip_profile_settings,
    pbx_users,
    pbx_user_settings,
    Prisma
   } from '@prisma/client'
  
  export interface AuthUserFull extends auth_user {}
  export interface AuthUserMapping extends auth_user_mapping {}
  export interface DomainMapping extends domain_mapping {}
  
  export interface PbxUserFull extends Omit<pbx_users, 'pbx_user_settings'> {
    auth_user: auth_user;
  }
  
  export interface PbxUserSettingFull extends pbx_user_settings {}
  
  export interface AccessControl extends pbx_access_controls {
    pbx_access_control_nodes: AccessControlNode[];
  }
  
  export interface AccessControlNode extends pbx_access_control_nodes {}
  
  export interface Extension extends pbx_extensions {
    pbx_extension_users: ExtensionUser[];
  }
  export interface ExtensionUser extends pbx_extension_users {}
  export interface Gateway extends pbx_gateways {}
  export interface Domain extends Omit<pbx_domains, 'domain_settings'> {}
  export interface DomainSetting extends pbx_domain_settings {}
  export interface AccessControl extends pbx_access_controls {}
  export interface EmailTemplate extends pbx_email_templates {}
  export interface Bridge extends pbx_bridges {}
  export interface SipProfileFull extends pbx_sip_profiles {
    pbx_sip_profile_domains: SipProfileDomainFull[];
    pbx_sip_profile_settings: SipProfileSettingFull[];
  }
  export interface SipProfileDomainFull extends pbx_sip_profile_domains {}
  export interface SipProfileSettingFull extends pbx_sip_profile_settings {}
  export interface EmailTemplate extends pbx_email_templates {}
  export interface Module extends pbx_modules {}
  export interface Variable extends pbx_vars {}
  export interface Tenant extends auth_tenant {}
  
  
  
  export type UserRole = "superuser" | "admin" | "staff" | "member"
  
  export const AUTH_USER_DEFAULTS = {
    emailVerified: false,
    isStaff: false,
    updatedAt: new Date(),
  } as const;
  
  export const PBX_USER_DEFAULTS = {
    user_uuid: crypto.randomUUID(),
    created: new Date(),
    updated: new Date(),
    updatedBy: 'system',
    disabled: false,
    status: 'active',
  } as const;
  
  export const PBX_USER_SETTING_DEFAULTS = {
    id: crypto.randomUUID(),
    created: new Date(),
    updated: new Date(),
    updated_by: 'system',
    disabled: false,
  } as const;
  
  export const TENANT_DEFAULTS = {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
    plan: 'basic',
    maxUsers: 5,
    disabled: false,
  } as const;
  
  export const VARIABLE_DEFAULTS = {
    id: crypto.randomUUID(),
    created: new Date(),
    updated: new Date(),
    updated_by: 'system',
    enabled: 'true',
  } as const;
  
  export const MODULE_DEFAULTS = {
    id: crypto.randomUUID(),
    created: new Date(),
    updated: new Date(),
    updated_by: 'system',
    enabled: 'true',
  } as const;
  
  export const EMAIL_TEMPLATE_DEFAULTS = {
    id: crypto.randomUUID(),
    created: new Date(),
    updated: new Date(),
    updatedBy: 'system',
    enabled: 'true',
  } as const;
  
  export const ACCESS_CONTROL_DEFAULTS = {
    created: new Date(),
    updated: new Date(),
    updated_by: 'system',
  } as const;
  
  
  export const ACCESS_CONTROL_NODE_DEFAULTS = {
    created: new Date(),
    updated: new Date(),
    updated_by: 'system',
  } as const;
  
  
  export const DEFAULT_EXTENSION_VALUES = {
    id: crypto.randomUUID(),
    created: new Date(),
    updated: new Date(),
    updated_by: 'system',
    disabled: false,
    directory_visible: 'true',
    directory_exten_visible: 'true',
    call_screen_enabled: 'false',
    do_not_disturb: 'false',
    forward_all_enabled: 'false',
    forward_busy_enabled: 'false',
    forward_no_answer_enabled: 'false',
    forward_user_not_registered_enabled: 'false',
    follow_me_enabled: 'false',
    force_ping: 'false',
  } as const;
  
  
  export const EXTENSION_USER_DEFAULTS = {
    id: crypto.randomUUID(),
    created: new Date(),
    updated: new Date(),
    updated_by: 'system',
  } as const;
  
  
  export const GATEWAY_DEFAULTS = {
    id: crypto.randomUUID(),
    created: new Date(),
    updated: new Date(),
    updated_by: 'system',
    enabled: 'true',
    register: 'true',
  } as const;
  
  export const BRIDGE_DEFAULTS = {
    id: crypto.randomUUID(),
    created: new Date(),
    updated: new Date(),
    updated_by: 'system',
    enabled: 'true',
  } as const;
  
  export const SIP_PROFILE_DEFAULTS = {
    created: new Date(),
    updated: new Date(),
    updated_by: 'system',
  } as const;
  
  export const SIP_PROFILE_DOMAIN_DEFAULTS = {
    created: new Date(),
    updated: new Date(),
    updated_by: 'system',
  } as const;
  
  export const SIP_PROFILE_SETTING_DEFAULTS = {
    created: new Date(),
    updated: new Date(),
    updated_by: 'system',
  } as const;
  
  export const DOMAIN_DEFAULTS = {
    id: crypto.randomUUID(),
    created: new Date(),
    updated: new Date(),
    updatedBy: 'system',
    disabled: false,
  } as const;
  
  export const DOMAIN_SETTING_DEFAULTS = {
    id: crypto.randomUUID(),
    created: new Date(),
    updated: new Date(),
    updated_by: 'system',
    enabled: 'true',
  } as const;
  
  
  export interface FirebaseAuthUser {
      uid: string
      accountId: string
      email: string
      displayName?: string | null
      photoURL?: string | null
      tenantId: string
      emailVerified: boolean
      disabled: boolean
      phoneNumber: string | null
      metadata: {
          creationTime: string | undefined
          lastSignInTime: string | undefined
        }
  }
  
    
  export interface DatabaseUserInput {
    uid: string
    email: string
    displayName?: string | null
    firstName?: string | null
    lastName?: string | null
    avatar: string | null
    tenantId: string
    isSuperuser: boolean
    isAdmin: boolean
    isStaff: boolean
    disabled: boolean
    phoneNumber?: string | null
    emailVerified: boolean
    createdAt?: Date | null
    lastSignInAt: Date | null
  }
  
  export interface PbxUserCreateInput {
    username: string;
    email?: string;
    department?: string;
    status: string;
    api_key?: string;
    domainId?: string;
    auth_user_id: string;
    settings?: PbxUserSettingCreateInput[];
  }
  
  export interface PbxUserSettingCreateInput {
    category: string;
    subcategory: string;
    value_type: string;
    value?: string;
    sequence: number;
    description?: string;
  }
  
  export type PbxUserDisplay = Pick<PbxUserFull,
    | 'id'
    | 'auth_user_id'
    | 'username'
    | 'email'
    | 'status'
    | 'disabled'
  > & {
    auth_user: Pick<auth_user,
      | 'displayName'
      | 'firstName'
      | 'lastName'
      | 'isAdmin'
      | 'isSuperuser'
      | 'isStaff'
      | 'avatar'
    >;
    role?: UserRole;
  };
  
  export type PbxUserSettingDisplay = Pick<PbxUserSettingFull,
    | 'id'
    | 'category'
    | 'subcategory'
    | 'value_type'
    | 'value'
    | 'disabled'
    | 'description'
  >;
  
  export type PbxUserUpdateInput = Partial<Omit<PbxUserFull, 'id' | 'created' | 'user_uuid' | 'auth_user' | 'pbx_user_settings'>> & {
    updated?: Date;
    updatedBy?: string;
    settings?: PbxUserSettingCreateInput[];
  };
  
  export type PbxUserSettingUpdateInput = Partial<Omit<PbxUserSettingFull, 'id' | 'created'>> & {
    updated?: Date;
    updated_by?: string;
  };
  
  export interface PbxUserFilters {
    username?: string;
    email?: string;
    status?: string;
    domainId?: string;
    disabled?: string;
  }
  
  // Sort type
  export type PbxUserSortField = 
    | 'username'
    | 'email'
    | 'status'
    | 'created'
    | 'updated';
  
  export interface PbxUserSortOptions {
    field: PbxUserSortField;
    direction: 'asc' | 'desc';
  }
    
  export interface SignUpResultOld {
      success: boolean
      user?: {
        uid: string
        email: string
        tenantId: string
        emailVerified: boolean
      }
      error?: {
        code: string
        message: string
      }
  }
  
  export interface SignUpResult {
    success: boolean;
    data?: {
      auth: AuthUserFull;
      pbx: PbxUserFull;
      tenant: Tenant;
      domain: Domain;
    };
    error?: {
      message: string;
      code?: number;
    };
  }
  
  export interface VerifyResult {
    success: boolean;
    data?: {
      auth: {
        uid: string;
        email: string;
        displayName: string | null;
        disabled: boolean;
        emailVerified: boolean;
        tenantId: string;
      };
      pbx?: {
        id: bigint;
        username: string;
        status: string;
        disabled: boolean;
      };
      tenant: {
        id: string;
        disabled: boolean;
        plan: string;
        maxUsers: number;
      };
    };
    error?: {
      message: string;
      code?: number;
    };
  }
  
  
    export interface User {
      uid: string
      name: string
      email: string
      avatar?: string
  }
  
  
  export interface VariableOld {
    id: string;
    name: string;
    value: string;
    hostname: string;
    enabled: string;
    description: string;
    category: string;
  }
  
  export interface VariableCreateInput {
    category: string;
    name: string;
    value?: string;
    command?: string;
    hostname?: string;
    sequence: number;
    description?: string;
  }
  
  
  export type VariableDisplay = Pick<Variable,
    | 'id'
    | 'category'
    | 'name'
    | 'value'
    | 'hostname'
    | 'enabled'
    | 'description'
  >;
  
  export type VariableUpdateInput = Partial<Omit<Variable, 'id' | 'created'>> & {
    updated?: Date;
    updated_by?: string;
  };
  
  export interface EmailTemplateOld {
    id: string;
    language: string;
    category: string;
    subcategory: string;
    subject: string;
    type: 'html' | 'text';
    enabled: boolean;
    description: string;
  }
  
  
  export interface EmailTemplateCreateInput {
    language: string;
    category: string;
    subcategory: string;
    type: string;
    subject?: string;
    body?: string;
    description?: string;
    domain_id_id?: string;
  }
  
  export type EmailTemplateDisplay = Pick<EmailTemplate,
    | 'id'
    | 'language'
    | 'category'
    | 'subcategory'
    | 'subject'
    | 'type'
    | 'enabled'
    | 'description'
  >;
  
  export type EmailTemplateUpdateInput = Partial<Omit<EmailTemplate, 'id' | 'created'>> & {
    updated?: Date;
    updatedBy?: string;
  };
  
  
  export interface ModuleOld {
    id: string;
    label: string;
    category: string;
    enabled: string;
    description: string;
    status?: 'running' | 'stopped'; 
  }
  
  
  export interface ModuleCreateInput {
    label: string;
    name: string;
    category: string;
    sequence: number;
    default_enabled: string;
    description?: string;
  }
  
  
  export type ModuleDisplay = Pick<Module,
    | 'id'
    | 'label'
    | 'name'
    | 'category'
    | 'enabled'
    | 'default_enabled'
    | 'description'
  >;
  
  export type ModuleUpdateInput = Partial<Omit<Module, 'id' | 'created'>> & {
    updated?: Date;
    updated_by?: string;
  };
  
  export interface ExtensionOld {
    id: string;
    extension: string;
    effective_caller_id_name: string;
    effective_caller_id_number: string;
    call_group: string;
    user_context: string;
    disabled: boolean;
  }
  
  
  export interface ExtensionCreateInput {
    extension: string;
    password: string;
    domain_uuid: string;
    description?: string;
    users?: ExtensionUserCreateInput[];
  }
  
  export type ExtensionDisplay = Pick<Extension,
  | 'id'
  | 'extension'
  | 'effective_caller_id_name'
  | 'effective_caller_id_number' 
  | 'call_group'
  | 'user_context'
  | 'disabled'
  >;
  
  export type ExtensionUpdateInput = Partial<Omit<Extension, 'id' | 'created' | 'pbx_extension_users'>> & {
    updated?: Date;
    updated_by?: string;
    users?: ExtensionUserCreateInput[]; 
  };
  
  export interface ExtensionUserCreateInput {
    extension_uuid: string;
    user_uuid: string;
    default_user: string;
  }
  
  export type ExtensionUserDisplay = Pick<ExtensionUser,
    | 'id'
    | 'extension_uuid'
    | 'user_uuid'
    | 'default_user'
  >;
  
  export type ExtensionUserUpdateInput = Partial<Omit<ExtensionUser, 'id' | 'created'>> & {
    updated?: Date;
    updated_by?: string;
  };
  
  
  export interface GatewayOld {
    id: string;
    gateway: string;
    proxy: string;
    context: string;
    status: string;
    action: string;
    state: string;
    description: string;
    enabled: string;
  }
  
  export interface GatewayCreateInput {
    gateway: string;
    proxy: string;
    context: string;
    profile: string;
    expire_seconds: number;
    retry_seconds: number;
    channels: number;
    register: string;
    domain_uuid?: string;
    description?: string;
  }
  
  export type GatewayDisplay = Pick<Gateway,
    | 'id'
    | 'gateway'
    | 'proxy'
    | 'context'
    | 'enabled'
    | 'description'
    | 'profile'
  >;
  
  export type GatewayUpdateInput = Partial<Omit<Gateway, 'id' | 'created'>> & {
    updated?: Date;
    updated_by?: string;
  };
  
  export interface BridgeOld {
    id: string;
    name: string;
    destination: string;
    enabled: boolean;
  }
  
  export type BridgeDisplay = Pick<Bridge,
    | 'id'
    | 'name'
    | 'destination'
    | 'disabled'
    | 'description'
  >;
  
  export type BridgeUpdateInput = Partial<Omit<Bridge, 'id' | 'created'>> & {
    updated?: Date;
    updated_by?: string;
  };
  
  export interface SipProfile {
    id: string;
    name: string;
    hostname: string;
    enabled: string;
    description: string;
  }
  
  export interface SipProfileCreateInput {
    name: string;
    hostname?: string;
    description?: string;
    domains?: SipProfileDomainCreateInput[];
    settings?: SipProfileSettingCreateInput[];
  }
  
  export type SipProfileDisplay = Pick<SipProfileFull,
    | 'id'
    | 'name'
    | 'hostname'
    | 'disabled'
    | 'description'
  >;
  
  export type SipProfileUpdateInput = Partial<Omit<SipProfileFull, 'id' | 'created'>> & {
    updated?: Date;
    updated_by?: string;
  };
  
  
  export interface SipProfileDomainCreateInput {
    name: string;
    alias: string;
    parse: string;
    sip_profile_id: string;
  }
  
  export type SipProfileDomainDisplay = Pick<SipProfileDomainFull,
    | 'id'
    | 'name'
    | 'alias'
    | 'parse'
  >;
  
  export interface SipProfileSettingCreateInput {
    name: string;
    value?: string;
    description?: string;
    sip_profile_id: string;
  }
  
  export type SipProfileSettingDisplay = Pick<SipProfileSettingFull,
    | 'id'
    | 'name'
    | 'value'
    | 'disabled'
    | 'description'
  >;
  
  export type SipProfileSettingUpdateInput = Partial<Omit<SipProfileSettingFull, 'id' | 'created'>> & {
    updated?: Date;
    updated_by?: string;
  };
  
  export interface DomainOld {
    id: string;
    name: string;
    tenant: string
    portalName: string;
    homeSwitch?: string;
    description?: string;
    disabled: boolean;
  }
  
  
  export interface DomainCreateInput {
    name: string;
    tenantId: string;
    portalName?: string;
    homeSwitch?: string;
    description?: string;
    menuId?: string;
    settings?: DomainSettingCreateInput[];
  }
  
  export type DomainDisplay = Pick<Domain,
    | 'id'
    | 'name'
    | 'tenantId'
    | 'portalName'
    | 'homeSwitch'
    | 'description'
    | 'disabled'
  >;
  
  export type DomainUpdateInput = Partial<Omit<Domain, 'id' | 'created'>> & {
    updated?: Date;
    updatedBy?: string;
    settings?: DomainSettingCreateInput[];
  };
  
  export interface DomainSettingCreateInput {
    category: string;
    subcategory: string;
    value_type: string;
    value?: string;
    sequence: number;
    description?: string;
    app_uuid?: string;
    domainId: string;
  }
  
  export type DomainSettingDisplay = Pick<DomainSetting,
    | 'id'
    | 'category'
    | 'subcategory'
    | 'value_type'
    | 'value'
    | 'disabled'
    | 'description'
  >;
  
  export type DomainSettingUpdateInput = Partial<Omit<DomainSetting, 'id' | 'created'>> & {
    updated?: Date;
    updated_by?: string;
  };
  
  export interface AccessControlOld {
    id: string;
    name: string;
    default: string;
    description: string;
  }
  
  export interface AccessControlCreateInput {
    name: string;
    default: string;
    description?: string;
    nodes?: AccessControlNodeCreateInput[];
  }
  
  export type AccessControlDisplay = Pick<AccessControl,
    | 'id'
    | 'name'
    | 'default'
    | 'description'
  >;
  
  export type AccessControlUpdateInput = Partial<Omit<AccessControl, 'id' | 'created' | 'pbx_access_control_nodes'>> & {
    updated?: Date;
    updated_by?: string;
    nodes?: AccessControlNodeCreateInput[];
  };
  
  export interface AccessControlNodeCreateInput {
    type: string;
    cidr?: string;
    domain?: string;
    description?: string;
    access_control_id_id: string;
  }
  
  
  export type AccessControlNodeDisplay = Pick<AccessControlNode,
    | 'id'
    | 'type'
    | 'cidr'
    | 'domain'
    | 'description'
  >;
  
  export type AccessControlNodeUpdateInput = Partial<Omit<AccessControlNode, 'id' | 'created'>> & {
    updated?: Date;
    updated_by?: string;
  };
  
  
  export interface AuthUsers {
    uid: string;
    displayName: string;
    email: string;
    firstName: string;
    lastName: string;
    disabled: boolean;
    isAdmin: boolean;
    isStaff: boolean;
    isSuperuser: boolean;
  }
  
  
  export interface tenantBackup {
    id: string; 
    accountId: string;   
    createdAt: Date;
    updatedAt: Date;
    name: string;
    domain?: string        
    description?: string;        
    plan: string;       
    maxUsers: number;        
    disabled: Boolean       
  }
  
  export interface TenantCreateInput {
    accountId: string; 
    name: string;
    domain: string;
    description?: string;
    logo?: string;
    plan?: string;
    maxUsers?: number;
  }
  
  export type TenantDisplay = Pick<Tenant,
    | 'id'
    | 'accountId'
    | 'name'
    | 'domain'
    | 'description'
    | 'logo'
    | 'plan'
    | 'maxUsers'
    | 'disabled'
  >;
  
  export type TenantUpdateInput = Partial<Omit<Tenant, 'id' | 'accountId' | 'createdAt'>> & {
    updatedAt?: Date;
  };
  
  
  export interface TenantOption {
    id: string
    name: string
  }
  
  
    