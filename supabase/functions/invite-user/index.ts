import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@0.16.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { email, teamId, role, invitedBy } = await req.json();

        // 1. Check if user exists (optional, could just send email regardless)
        // 2. Insert into team_invitations
        const { data: invite, error: dbError } = await supabase
            .from("team_invitations")
            .insert({
                team_id: teamId || null,
                email,
                role,
                status: "pending",
            })
            .select()
            .single();

        if (dbError) throw dbError;

        // 3. Send Email
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: "Nabd Chain <onboarding@resend.dev>", // Or your verified domain
            to: [email],
            subject: "You have been invited to join the team",
            html: `
        <h1>Welcome!</h1>
        <p>You have been invited to join the workspace/team as a <strong>${role}</strong>.</p>
        <p><a href="http://localhost:5173/signup?invite=${invite.id}">Click here to accept invitation</a></p>
      `,
        });

        if (emailError) throw emailError;

        return new Response(JSON.stringify({ message: "Invitation sent successfully" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
