import React from 'react';

const JOBS_DATA = [
    { id: 1, title: 'Senior Product Designer', company: 'Google', location: 'Mountain View, CA', type: 'Full-time', model: 'Hybrid', salary: '$140k - $220k', time: '2 days ago', featured: true, logo: 'G' },
    { id: 2, title: 'Frontend Developer', company: 'Tesla', location: 'Austin, TX', type: 'Contract', model: 'On-site', salary: '$90k - $130k', time: '5 hours ago', featured: false, logo: 'T' },
    { id: 3, title: 'Marketing Manager', company: 'Meta', location: 'Remote', type: 'Full-time', model: 'Remote', salary: '$110k - $160k', time: '1 week ago', featured: false, highDemand: true, logo: 'M' },
];

export default function JobSearch() {
    return (
        <div className="flex flex-1 max-w-[1440px] mx-auto w-full p-6 lg:p-8 gap-10">
            {/* SIDEBAR FILTER */}
            <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-8 sticky top-28 overflow-y-auto">
                <div className="border border-border-light dark:border-border-dark p-5 bg-slate-50 dark:bg-surface-dark">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-sm uppercase tracking-wider">My Resume</h3>
                        <span className="flex size-2 bg-red-500 rounded-full" title="No CV Uploaded"></span>
                    </div>
                    <button className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider py-2.5 transition-colors rounded">
                        Upload CV
                    </button>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted">Job Role</h4>
                    <div className="space-y-3">
                        {['Software Engineer', 'Product Designer', 'Data Scientist'].map(role => (
                            <label key={role} className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="size-4 border-slate-300 text-primary rounded-sm focus:ring-0" />
                                <span className="text-sm text-text-muted group-hover:text-text-main dark:group-hover:text-white">{role}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 min-w-0">
                <div className="bg-slate-50 dark:bg-surface-dark p-8 mb-10 border border-border-light dark:border-border-dark rounded-lg">
                    <h2 className="text-3xl font-bold mb-3">Find your next opportunity</h2>
                    <p className="text-text-muted mb-8">Browse thousands of job openings from top technology companies.</p>

                    <div className="flex flex-col md:flex-row gap-0 border border-border-light dark:border-border-dark bg-white dark:bg-background-dark rounded-lg overflow-hidden">
                        <div className="flex-1 relative border-b md:border-b-0 md:border-r border-border-light dark:border-border-dark">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">search</span>
                            <input type="text" placeholder="Job title or keywords" className="w-full pl-12 pr-4 h-14 border-none bg-transparent focus:ring-0 text-sm" />
                        </div>
                        <button className="bg-primary hover:bg-primary-dark text-white font-bold px-10 h-14 transition-colors">
                            SEARCH
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {JOBS_DATA.map(job => (
                        <div key={job.id} className="group bg-white dark:bg-surface-dark p-6 border border-border-light dark:border-border-dark hover:border-primary transition-colors rounded-lg relative">
                            {(job.featured || job.highDemand) && (
                                <div className="absolute top-0 right-0 flex">
                                    {job.highDemand && <span className="bg-orange-600 text-white text-[10px] font-bold px-3 py-1 uppercase rounded-bl-lg">HOT</span>}
                                    {job.featured && <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 uppercase">FEATURED</span>}
                                </div>
                            )}
                            <div className="flex items-start gap-5 mb-5 mt-2">
                                <div className="size-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center font-bold text-xl text-primary">
                                    {job.logo}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg group-hover:text-primary transition-colors cursor-pointer">{job.title}</h4>
                                    <p className="text-sm font-medium text-text-muted mt-1">{job.company} • {job.location}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {[job.type, job.model, job.salary].map(tag => (
                                    <span key={tag} className="px-2 py-1 text-xs font-bold uppercase bg-slate-100 dark:bg-slate-800 text-text-muted rounded">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center justify-between pt-5 border-t border-border-light dark:border-border-dark">
                                <span className="text-xs font-medium text-slate-400 uppercase">{job.time}</span>
                                <button className="bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase px-5 py-2 rounded transition-colors">
                                    Apply Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}