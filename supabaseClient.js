import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.0.0/+esm';

const supabaseUrl = 'https://kiwuzfwvrahadfearfcs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpd3V6Znd2cmFoYWRmZWFyZmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3Njc2NTIsImV4cCI6MjA2MDM0MzY1Mn0.8sI-kWhIsMf_u_QaH5mLmo66oPjZhNspNjUOjmAlYZo'; 

export const supabase = createClient(supabaseUrl, supabaseKey);

// Real-time subscription to profiles table
supabase.channel('public:profiles')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
        console.log('Change received!', payload);
        // Handle the real-time update here
    })
    .subscribe();

// Function to sign up a user and insert data into profiles table
export async function signUpUser(userType, username, email, password, confirmPassword) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        console.log("Error signing up:", error.message);
        return false;
    }

    console.log("User signed up successfully:", data);

    const { error: insertError } = await supabase
        .from('profiles')
        .insert([
            { id: data.user.id, username: username, email: email, user_type: userType }
        ]);

    if (insertError) {
        console.log("Error inserting into profiles table:", insertError.message);
        return false;
    }

    console.log("Data inserted into profiles table successfully");
    return true;
}


// Function to sign in a user and check if they exist in the profiles table
export async function signInUser(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        console.log("Error signing in:", error.message);
        return false;
    }

    console.log("User signed in successfully:", data);

    // Check if the user exists in the profiles table
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (profileError) {
        console.log("Error checking profiles table:", profileError.message);
        return false;
    }

    console.log("User exists in profiles table:", profileData);
    return true;
}

// Function to get user_type of current session
export async function getUserType() {
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session || !session.session || !session.session.user) {
        console.log("No user session found or error fetching session:", sessionError?.message);
        return null;
    }

    const userId = session.session.user.id;

    if (!userId) {
        console.log("User ID is undefined");
        return null;
    }

    const { data: profileData, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

    if (error) {
        console.log("Error fetching user type:", error.message);
        return null;
    }

    return profileData.user_type;
}
