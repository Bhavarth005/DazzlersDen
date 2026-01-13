"use client"

import { useState, useEffect } from "react";
import { 
    Plus, 
    Search, 
    Shield, 
    User as UserIcon, 
    Trash2, 
    X, 
    Loader2, 
    CheckCircle2,
    ShieldAlert,
    AlertTriangle // New icon for warning
} from "lucide-react";
import { toast } from "sonner";

// --- Types ---
type UserRole = "ADMIN" | "SUPERADMIN";

type User = {
    id: number;
    username: string;
    role: UserRole;
};

export default function UserManagement() {
    // --- State ---
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete Modal State
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        role: "ADMIN" as UserRole
    });

    // --- API Interactions ---

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin', { headers: { 'Content-type': 'application/json' } });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                // console.error("Failed to fetch users");
                toast.error("Failed to fetch users!");
            }
        } catch (error) {
            toast.error("Network error fetching users" + error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.username || !formData.password) return;

        console.log(formData)

        setIsSubmitting(true);
        
        try {
            const res = await fetch('/api/admin/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await res.json();

            if (res.ok) {
                const newUser: User = {
                    id: data.id || Math.random(),
                    username: formData.username,
                    role: formData.role
                };
                
                setUsers([newUser, ...users]);
                setIsCreateModalOpen(false);
                setFormData({ username: "", password: "", role: "ADMIN" }); 
                toast.success(data.message || "User created successfully");
            } else {
                toast.success(data.message || "Failed to create user");
            }
        } catch (error) {
            toast.success("Network error while creating user");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 1. Open Delete Modal
    const initiateDelete = (user: User) => {
        setUserToDelete(user);
    };

    // 2. Perform API Delete
    const confirmDelete = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);

        try {
            const res = await fetch(`/api/admin/${userToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Content-type': 'application/json' }
            });

            const data = await res.json();

            if (res.ok) {
                setUsers(users.filter(u => u.id !== userToDelete.id));
                setUserToDelete(null);
                toast.success("User deleted!")
            } else {
                alert(data.message || "Failed to delete user");
            }
        } catch (error) {
            alert("Network error deleting user");
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in-up p-4">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage system access and roles</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-semibold shadow-md shadow-blue-500/20 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    <span>New User</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search users by username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 h-11 rounded-lg border border-slate-300 dark:border-gray-600 bg-slate-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                </div>
            </div>

            {/* Users List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                    ))
                ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <div 
                            key={user.id} 
                            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold tracking-wider ${
                                user.role === "SUPERADMIN" 
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            }`}>
                                {user.role}
                            </div>

                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full ${
                                    user.role === "SUPERADMIN" 
                                        ? "bg-purple-50 text-purple-600 dark:bg-purple-900/20" 
                                        : "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                                }`}>
                                    {user.role === "SUPERADMIN" ? <ShieldAlert size={24} /> : <Shield size={24} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{user.username}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        ID: #{user.id}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-gray-700 flex justify-end">
                                <button 
                                    onClick={() => initiateDelete(user)}
                                    className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                    Delete User
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                        <UserIcon size={48} className="mb-4 opacity-20" />
                        <p>No users found matching your search.</p>
                    </div>
                )}
            </div>

            {/* CREATE USER MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div 
                        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New User</h3>
                            <button 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Username</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    required
                                    placeholder="e.g. front_desk_1"
                                    value={formData.username}
                                    onChange={e => setFormData({...formData, username: e.target.value})}
                                    className="w-full px-4 h-12 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                                <input 
                                    type="password" 
                                    required
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                    className="w-full px-4 h-12 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Role</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`
                                        cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all
                                        ${formData.role === 'ADMIN' 
                                            ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 ring-1 ring-blue-500/20' 
                                            : 'border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700'}
                                    `}>
                                        <input 
                                            type="radio" 
                                            name="role" 
                                            className="sr-only"
                                            checked={formData.role === 'ADMIN'}
                                            onChange={() => setFormData({...formData, role: 'ADMIN'})}
                                        />
                                        <Shield size={18} />
                                        <span className="font-medium">Admin</span>
                                    </label>

                                    <label className={`
                                        cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all
                                        ${formData.role === 'SUPERADMIN' 
                                            ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300 ring-1 ring-purple-500/20' 
                                            : 'border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700'}
                                    `}>
                                        <input 
                                            type="radio" 
                                            name="role" 
                                            className="sr-only"
                                            checked={formData.role === 'SUPERADMIN'}
                                            onChange={() => setFormData({...formData, role: 'SUPERADMIN'})}
                                        />
                                        <ShieldAlert size={18} />
                                        <span className="font-medium">Super Admin</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {userToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div 
                        className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-red-100 dark:border-red-900/30 overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 text-center flex flex-col items-center gap-4">
                            <div className="h-14 w-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 mb-2">
                                <AlertTriangle size={32} />
                            </div>
                            
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete User?</h3>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-white">"{userToDelete.username}"</span>?
                                    <br/> This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-100 dark:border-gray-700 flex gap-3">
                            <button
                                onClick={() => setUserToDelete(null)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md shadow-red-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        <span>Delete</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}