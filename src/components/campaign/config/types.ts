export interface CampaignMember {
  id: string;
  user_id: string;
  role: string;
  profile?: { display_name: string };
}

export interface ConfirmAction {
  type: 'kick' | 'delete' | 'end';
  userId?: string;
  userName?: string;
}
