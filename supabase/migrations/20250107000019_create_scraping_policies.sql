-- ============================================================================
-- CREATE RLS POLICIES FOR SCRAPING TABLES
-- ============================================================================
-- Row Level Security policies for scraping and logging tables
-- Created: 2025-01-07
-- ============================================================================

-- Scraping logs policies
CREATE POLICY "Service role can manage scraping logs" ON public.scraping_logs
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can manage scraping logs" ON public.scraping_logs 
    FOR ALL USING (public.current_user_is_admin());

-- Send scrape status logs policies
CREATE POLICY "Service role can manage status logs" ON public.send_scrape_status_logs
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can read status logs" ON public.send_scrape_status_logs 
    FOR SELECT USING (public.current_user_is_admin());