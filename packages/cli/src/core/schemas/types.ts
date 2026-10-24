export interface CommandArgDef {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'json-file' | 'array';
  required: boolean;
  description: string;
  default?: any;
}

export interface ActionDef {
  action: string;
  description: string;
  args: CommandArgDef[];
  example: string;
  mutating: boolean;
}

export interface ResourceSchemaDef {
  noun: string;
  description: string;
  actions: ActionDef[];
}
