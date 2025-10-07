import { supabase } from './supabase';

/**
 * Check if the current user is an admin using the Supabase admin function
 */
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('user_is_admin', {
      user_id: userId
    });

    if (error) {
      console.error('Error checking admin status via RPC:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in admin RPC check:', error);
    return false;
  }
};

/**
 * Check if current authenticated user is admin using the Supabase admin function
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    console.log('🔍 Checking current user admin status via RPC...');
    const { data, error } = await supabase.rpc('current_user_is_admin');

    if (error) {
      console.error('⚠️ RPC error checking current user admin status:', error.message);
      // If function doesn't exist, return false but don't treat as critical error
      if (error.message.includes('function') && error.message.includes('schema cache')) {
        console.log('📝 Admin functions not yet deployed, using fallback methods');
        return false;
      }
      return false;
    }

    console.log('✅ RPC current_user_is_admin result:', data);
    return data === true;
  } catch (error) {
    console.error('❌ Exception in current user admin check:', error);
    return false;
  }
};

/**
 * Check if user email matches ADMIN_EMAIL environment variable
 */
export const isAdminEmail = (session: any): boolean => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EXPO_PUBLIC_ADMIN_EMAIL;
  return session?.user?.email === adminEmail;
};

/**
 * Check if user has admin role in app_metadata (fallback method)
 */
export const hasAdminRole = (session: any): boolean => {
  return session?.user?.app_metadata?.roles?.includes('admin') || false;
};

/**
 * Check if user is the first user (another fallback method)
 */
export const isFirstUser = async (session: any): Promise<boolean> => {
  if (!session?.user?.id) return false;

  try {
    // Get the first user from auth.users table
    const { data: users, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    
    if (error) {
      console.error('Error getting users for first user check:', error);
      return false;
    }

    if (users.users.length === 0) return false;

    // Sort by created_at and check if current user is first
    const sortedUsers = users.users.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const firstUser = sortedUsers[0];

    console.log(`👤 First user: ${firstUser.email} (${firstUser.id})`);
    console.log(`🆔 Current user: ${session.user.email} (${session.user.id})`);
    
    return firstUser.id === session.user.id;
  } catch (error) {
    console.error('Error checking first user status:', error);
    return false;
  }
};

/**
 * Comprehensive admin check - uses multiple methods in priority order
 */
export const checkAdminStatus = async (session: any): Promise<boolean> => {
  if (!session?.user?.id) {
    console.log('❌ No session or user ID provided');
    return false;
  }

  console.log(`🔍 Checking admin status for user: ${session.user.email} (${session.user.id})`);

  try {
    // Primary method: Check ADMIN_EMAIL environment variable
    console.log('🔗 Checking ADMIN_EMAIL...');
    const isEmailAdmin = isAdminEmail(session);
    if (isEmailAdmin) {
      console.log('✅ User is admin via ADMIN_EMAIL environment variable');
      return true;
    }

    // Secondary method: Use Supabase admin function
    console.log('🔗 Attempting RPC admin check...');
    const isAdmin = await isCurrentUserAdmin();
    if (isAdmin) {
      console.log('✅ User is admin via RPC function');
      return true;
    }

    // Fallback 1: Check app_metadata
    console.log('🔗 Checking app_metadata...');
    const hasRole = hasAdminRole(session);
    if (hasRole) {
      console.log('✅ User is admin via app_metadata role');
      return true;
    }

    // Fallback 2: Check if first user
    console.log('🔗 Checking if first user...');
    const isFirst = await isFirstUser(session);
    if (isFirst) {
      console.log('✅ User is admin as first registered user');
      return true;
    }

    console.log('❌ User is not admin by any method');
    return false;
  } catch (error) {
    console.error('❌ Error in comprehensive admin check:', error);
    // Final fallback: Check ADMIN_EMAIL and app_metadata
    const emailResult = isAdminEmail(session);
    const metadataResult = hasAdminRole(session);
    const fallbackResult = emailResult || metadataResult;
    console.log(`🔄 Using fallback results - Email: ${emailResult}, Metadata: ${metadataResult}, Final: ${fallbackResult}`);
    return fallbackResult;
  }
};

/**
 * Grant admin rights to a user (admin only)
 */
export const grantAdminRights = async (targetUserId: string, notes?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('grant_admin_rights', {
      target_user_id: targetUserId,
      notes: notes || null
    });

    if (error) {
      console.error('Error granting admin rights:', error);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error('Error in grant admin rights:', error);
    return false;
  }
};

/**
 * Revoke admin rights from a user (admin only)
 */
export const revokeAdminRights = async (targetUserId: string, notes?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('revoke_admin_rights', {
      target_user_id: targetUserId,
      notes: notes || null
    });

    if (error) {
      console.error('Error revoking admin rights:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in revoke admin rights:', error);
    return false;
  }
};