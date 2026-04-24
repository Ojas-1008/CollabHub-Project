import { useState } from "react";
import { useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../hooks/useProfile";

// Icons from lucide-react (same icon library used everywhere else in CollabHub)
import {
    ArrowLeftIcon,
    Loader2Icon,
    SaveIcon,
    BriefcaseIcon,
    BuildingIcon,
    PenLineIcon,
    CodeIcon,
    LinkIcon,
    AtSignIcon,
    GlobeIcon,
    PlusIcon,
    XIcon,
    CheckCircle2Icon,
    ClockIcon,
    ListTodoIcon,
    ActivityIcon,
    SparklesIcon,
} from "lucide-react";

/**
 * 👤 PROFILE PAGE
 *
 * This is the full-screen profile management page for CollabHub.
 * It's divided into three visual sections:
 *
 *   1. HEADER  — Avatar, name, email, and status from Clerk
 *   2. EDITOR  — Editable fields (Bio, Job, Department, Social Links, Skills)
 *   3. INSIGHTS — Task stats and recent activity feed
 *
 * DATA FLOW:
 *   - Clerk gives us the user's avatar, name, and email (read-only here).
 *   - Our MongoDB database stores the extended profile fields.
 *   - The useProfile() hook handles fetching and saving via TanStack Query.
 */
const ProfilePage = () => {
    const navigate = useNavigate();

    // ── STEP 1: GET DATA ─────────────────────────────────────────────────
    // Clerk provides identity data (avatar, name, email).
    // Our custom hook provides MongoDB profile data + stats + activity.
    const { user: clerkUser } = useUser();
    const { user, stats, recentActivity, isLoading, saveProfile, isSaving } = useProfile();

    // ── STEP 2: LOCAL FORM STATE ─────────────────────────────────────────
    // We keep a local copy of the editable fields so the user can make changes
    // before clicking "Save". This avoids sending a request on every keystroke.
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);     // Initialized after data loads
    const [newSkill, setNewSkill] = useState("");        // Input field for adding skills

    // ── STEP 3: INITIALIZE FORM WHEN DATA ARRIVES ────────────────────────
    // We wait for user data to load, then seed the form state.
    // This only runs on the first render where user is available.
    if (user && !formData) {
        setFormData({
            bio: user.bio || "",
            jobTitle: user.jobTitle || "",
            department: user.department || "",
            socialLinks: {
                github: user.socialLinks?.github || "",
                linkedin: user.socialLinks?.linkedin || "",
                twitter: user.socialLinks?.twitter || "",
                website: user.socialLinks?.website || "",
            },
            skills: user.skills || [],
        });
    }

    // ── STEP 4: FORM HELPERS ─────────────────────────────────────────────

    // Updates a single field in the form data
    const handleFieldChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Updates a nested field inside socialLinks
    const handleSocialChange = (platform, value) => {
        setFormData((prev) => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, [platform]: value },
        }));
    };

    // Adds a new skill tag to the array
    const handleAddSkill = () => {
        const trimmed = newSkill.trim();
        // Guard: Don't add empty, duplicate, or too many skills
        if (!trimmed) return;
        if (formData.skills.includes(trimmed)) return;
        if (formData.skills.length >= 10) return;

        setFormData((prev) => ({
            ...prev,
            skills: [...prev.skills, trimmed],
        }));
        setNewSkill(""); // Clear the input
    };

    // Removes a skill tag by its index
    const handleRemoveSkill = (index) => {
        setFormData((prev) => ({
            ...prev,
            skills: prev.skills.filter((_, i) => i !== index),
        }));
    };

    // Saves the form to MongoDB via our API
    const handleSave = () => {
        saveProfile(formData);
        setIsEditing(false);
    };

    // Enters edit mode — resets form to current DB values
    const handleStartEditing = () => {
        setFormData({
            bio: user.bio || "",
            jobTitle: user.jobTitle || "",
            department: user.department || "",
            socialLinks: {
                github: user.socialLinks?.github || "",
                linkedin: user.socialLinks?.linkedin || "",
                twitter: user.socialLinks?.twitter || "",
                website: user.socialLinks?.website || "",
            },
            skills: user.skills || [],
        });
        setIsEditing(true);
    };

    // ── LOADING STATE ────────────────────────────────────────────────────
    if (isLoading || !formData) {
        return (
            <div className="profile-page-loader">
                <Loader2Icon className="size-8 text-purple-600 animate-spin" />
                <p>Loading your profile...</p>
            </div>
        );
    }

    // ── RENDER ───────────────────────────────────────────────────────────
    return (
        <div className="profile-page">
            {/* Animated background blobs for visual depth */}
            <div className="profile-bg-blob profile-bg-blob--1" />
            <div className="profile-bg-blob profile-bg-blob--2" />
            <div className="profile-bg-blob profile-bg-blob--3" />

            <div className="profile-page__inner">

                {/* ── TOP BAR ─────────────────────────────────────────── */}
                <div className="profile-topbar">
                    <button onClick={() => navigate("/")} className="profile-back-btn">
                        <ArrowLeftIcon className="size-4" />
                        <span>Back to Chat</span>
                    </button>

                    {isEditing ? (
                        <div className="profile-topbar__actions">
                            <button onClick={() => setIsEditing(false)} className="profile-cancel-btn">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={isSaving} className="profile-save-btn">
                                {isSaving ? <Loader2Icon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
                                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleStartEditing} className="profile-edit-btn">
                            <PenLineIcon className="size-4" />
                            <span>Edit Profile</span>
                        </button>
                    )}
                </div>

                {/* ── SECTION 1: PROFILE HEADER ────────────────────────── */}
                <div className="profile-header-card">
                    <div className="profile-header-card__avatar-ring">
                        <img
                            src={clerkUser?.imageUrl}
                            alt={clerkUser?.fullName || "Avatar"}
                            className="profile-header-card__avatar"
                        />
                    </div>
                    <div className="profile-header-card__info">
                        <h1 className="profile-header-card__name">{clerkUser?.fullName || "User"}</h1>
                        <p className="profile-header-card__email">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
                        {user.status && (
                            <div className="profile-header-card__status">
                                <span>{user.status}</span>
                            </div>
                        )}
                    </div>
                    {/* STAT PILLS */}
                    <div className="profile-stat-pills">
                        <div className="profile-stat-pill">
                            <ListTodoIcon className="size-4 text-purple-500" />
                            <span className="profile-stat-pill__value">{stats.totalTasks}</span>
                            <span className="profile-stat-pill__label">Total</span>
                        </div>
                        <div className="profile-stat-pill">
                            <CheckCircle2Icon className="size-4 text-emerald-500" />
                            <span className="profile-stat-pill__value">{stats.completedTasks}</span>
                            <span className="profile-stat-pill__label">Done</span>
                        </div>
                        <div className="profile-stat-pill">
                            <ClockIcon className="size-4 text-amber-500" />
                            <span className="profile-stat-pill__value">{stats.pendingTasks}</span>
                            <span className="profile-stat-pill__label">Pending</span>
                        </div>
                    </div>
                </div>

                {/* ── SECTION 2: PROFILE EDITOR ───────────────────────── */}
                <div className="profile-grid">

                    {/* LEFT COLUMN: Bio & Job Details */}
                    <div className="profile-card">
                        <h2 className="profile-card__title">
                            <BriefcaseIcon className="size-4" />
                            <span>About</span>
                        </h2>

                        {/* BIO */}
                        <div className="profile-field">
                            <label className="profile-field__label">Bio</label>
                            {isEditing ? (
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => handleFieldChange("bio", e.target.value)}
                                    maxLength={160}
                                    rows={3}
                                    placeholder="Tell your team a little about yourself..."
                                    className="profile-field__textarea"
                                />
                            ) : (
                                <p className="profile-field__value">
                                    {user.bio || <span className="profile-field__empty">No bio yet</span>}
                                </p>
                            )}
                        </div>

                        {/* JOB TITLE */}
                        <div className="profile-field">
                            <label className="profile-field__label">Job Title</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.jobTitle}
                                    onChange={(e) => handleFieldChange("jobTitle", e.target.value)}
                                    placeholder="e.g. Frontend Developer"
                                    className="profile-field__input"
                                />
                            ) : (
                                <p className="profile-field__value">
                                    {user.jobTitle || <span className="profile-field__empty">Not set</span>}
                                </p>
                            )}
                        </div>

                        {/* DEPARTMENT */}
                        <div className="profile-field">
                            <label className="profile-field__label">
                                <BuildingIcon className="size-3 inline mr-1" />
                                Department
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => handleFieldChange("department", e.target.value)}
                                    placeholder="e.g. Engineering"
                                    className="profile-field__input"
                                />
                            ) : (
                                <p className="profile-field__value">
                                    {user.department || <span className="profile-field__empty">Not set</span>}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Social Links & Skills */}
                    <div className="profile-card">
                        <h2 className="profile-card__title">
                            <GlobeIcon className="size-4" />
                            <span>Social & Skills</span>
                        </h2>

                        {/* SOCIAL LINKS */}
                        <div className="profile-social-list">
                            <SocialField
                                icon={<CodeIcon className="size-4" />}
                                label="GitHub"
                                value={isEditing ? formData.socialLinks.github : user.socialLinks?.github}
                                isEditing={isEditing}
                                onChange={(val) => handleSocialChange("github", val)}
                                placeholder="https://github.com/username"
                            />
                            <SocialField
                                icon={<LinkIcon className="size-4" />}
                                label="LinkedIn"
                                value={isEditing ? formData.socialLinks.linkedin : user.socialLinks?.linkedin}
                                isEditing={isEditing}
                                onChange={(val) => handleSocialChange("linkedin", val)}
                                placeholder="https://linkedin.com/in/username"
                            />
                            <SocialField
                                icon={<AtSignIcon className="size-4" />}
                                label="Twitter"
                                value={isEditing ? formData.socialLinks.twitter : user.socialLinks?.twitter}
                                isEditing={isEditing}
                                onChange={(val) => handleSocialChange("twitter", val)}
                                placeholder="https://twitter.com/username"
                            />
                            <SocialField
                                icon={<GlobeIcon className="size-4" />}
                                label="Website"
                                value={isEditing ? formData.socialLinks.website : user.socialLinks?.website}
                                isEditing={isEditing}
                                onChange={(val) => handleSocialChange("website", val)}
                                placeholder="https://yourwebsite.com"
                            />
                        </div>

                        {/* SKILLS */}
                        <div className="profile-field" style={{ marginTop: "1.5rem" }}>
                            <label className="profile-field__label">
                                <SparklesIcon className="size-3 inline mr-1" />
                                Skills
                            </label>
                            <div className="profile-skills-cloud">
                                {(isEditing ? formData.skills : user.skills || []).map((skill, index) => (
                                    <span key={index} className="profile-skill-tag">
                                        {skill}
                                        {isEditing && (
                                            <button
                                                onClick={() => handleRemoveSkill(index)}
                                                className="profile-skill-tag__remove"
                                            >
                                                <XIcon className="size-3" />
                                            </button>
                                        )}
                                    </span>
                                ))}
                                {(isEditing ? formData.skills : user.skills || []).length === 0 && (
                                    <span className="profile-field__empty">No skills added</span>
                                )}
                            </div>
                            {isEditing && formData.skills.length < 10 && (
                                <div className="profile-skill-adder">
                                    <input
                                        type="text"
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                                        placeholder="Type a skill and press Enter"
                                        maxLength={30}
                                        className="profile-field__input"
                                    />
                                    <button onClick={handleAddSkill} className="profile-skill-add-btn">
                                        <PlusIcon className="size-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── SECTION 3: RECENT ACTIVITY ──────────────────────── */}
                <div className="profile-card profile-activity-card">
                    <h2 className="profile-card__title">
                        <ActivityIcon className="size-4" />
                        <span>Recent Activity</span>
                    </h2>

                    {recentActivity.length === 0 ? (
                        <div className="profile-activity-empty">
                            <ActivityIcon className="size-8 text-purple-200" />
                            <p>No activity recorded yet.</p>
                        </div>
                    ) : (
                        <div className="profile-activity-timeline">
                            {recentActivity.map((log) => (
                                <ActivityItem key={log._id} log={log} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


/**
 * 🔗 SOCIAL FIELD — A single social link row (icon + label + value/input)
 */
const SocialField = ({ icon, label, value, isEditing, onChange, placeholder }) => {
    return (
        <div className="profile-social-item">
            <div className="profile-social-item__icon">{icon}</div>
            {isEditing ? (
                <input
                    type="url"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="profile-field__input"
                />
            ) : value ? (
                <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-social-item__link"
                >
                    {value}
                </a>
            ) : (
                <span className="profile-field__empty">Not linked</span>
            )}
        </div>
    );
};


/**
 * 📋 ACTIVITY ITEM — A single row in the activity timeline
 */
const ActivityItem = ({ log }) => {
    // Map action codes to friendly labels and colors
    const actionMap = {
        CREATE_TASK:        { label: "Created a task",       color: "text-emerald-600", bg: "bg-emerald-50" },
        UPDATE_TASK:        { label: "Updated a task",       color: "text-blue-600",    bg: "bg-blue-50" },
        DELETE_TASK:        { label: "Deleted a task",       color: "text-red-600",     bg: "bg-red-50" },
        UPDATE_TASK_STATUS: { label: "Changed task status",  color: "text-amber-600",   bg: "bg-amber-50" },
        UPDATE_USER_STATUS: { label: "Updated status",       color: "text-purple-600",  bg: "bg-purple-50" },
        UPDATE_PROFILE:     { label: "Updated profile",      color: "text-indigo-600",  bg: "bg-indigo-50" },
    };

    const info = actionMap[log.action] || { label: log.action, color: "text-gray-600", bg: "bg-gray-50" };

    // Format the date into a human-readable string
    const timeAgo = formatTimeAgo(new Date(log.createdAt));

    return (
        <div className="profile-activity-item">
            <div className="profile-activity-item__dot" />
            <div className="profile-activity-item__content">
                <span className={`profile-activity-item__badge ${info.color} ${info.bg}`}>
                    {info.label}
                </span>
                {log.metadata?.taskTitle && (
                    <span className="profile-activity-item__detail">
                        — {log.metadata.taskTitle}
                    </span>
                )}
                <span className="profile-activity-item__time">{timeAgo}</span>
            </div>
        </div>
    );
};


/**
 * ⏱️ FORMAT TIME AGO — Converts a Date into "2 hours ago", "3 days ago", etc.
 * This is a simple helper so we don't need an external library like date-fns.
 */
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60)    return "Just now";
    if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    // For older dates, show the actual date
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}


export default ProfilePage;
