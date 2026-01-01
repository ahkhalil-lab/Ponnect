'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
}

const DOG_SIZES = ['Small (under 10kg)', 'Medium (10-25kg)', 'Large (25-45kg)', 'Giant (over 45kg)'];

export default function CreateProviderPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        businessName: '',
        categoryId: '',
        description: '',
        suburb: '',
        postcode: '',
        serviceRadius: 10,
        email: '',
        phone: '',
        website: '',
        bookingUrl: '',
        priceRange: '$$',
        dogSizes: [] as string[],
        services: [] as string[],
    });
    const [newService, setNewService] = useState('');

    useEffect(() => {
        fetch('/api/services/categories')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setCategories(data.data);
                }
            });
    }, []);

    const updateField = (field: string, value: unknown) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleDogSize = (size: string) => {
        setFormData(prev => ({
            ...prev,
            dogSizes: prev.dogSizes.includes(size)
                ? prev.dogSizes.filter(s => s !== size)
                : [...prev.dogSizes, size]
        }));
    };

    const addService = () => {
        if (newService.trim() && !formData.services.includes(newService.trim())) {
            setFormData(prev => ({
                ...prev,
                services: [...prev.services, newService.trim()]
            }));
            setNewService('');
        }
    };

    const removeService = (service: string) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.filter(s => s !== service)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch('/api/services/providers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                router.push('/services?created=true');
            } else {
                setError(data.error || 'Failed to create listing');
            }
        } catch (err) {
            console.error(err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                return formData.businessName && formData.categoryId && formData.description.length >= 50;
            case 2:
                return formData.suburb && formData.postcode && formData.email;
            case 3:
                return true;
            default:
                return false;
        }
    };

    return (
        <div className={styles.page}>
            <h1>List Your Service</h1>
            <p className={styles.subtitle}>Reach thousands of dog parents in your area</p>

            {/* Progress Steps */}
            <div className={styles.progress}>
                {[1, 2, 3].map(s => (
                    <div
                        key={s}
                        className={`${styles.progressStep} ${s === step ? styles.active : ''} ${s < step ? styles.complete : ''}`}
                    >
                        <span className={styles.stepNumber}>{s < step ? '✓' : s}</span>
                        <span className={styles.stepLabel}>
                            {s === 1 ? 'Business Info' : s === 2 ? 'Location & Contact' : 'Details'}
                        </span>
                    </div>
                ))}
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <div className={styles.stepContent}>
                        <div className={styles.formGroup}>
                            <label>Business Name *</label>
                            <input
                                type="text"
                                value={formData.businessName}
                                onChange={e => updateField('businessName', e.target.value)}
                                placeholder="e.g. Pawfect Grooming Studio"
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Category *</label>
                            <div className={styles.categoryGrid}>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        className={`${styles.categoryOption} ${formData.categoryId === cat.id ? styles.selected : ''}`}
                                        onClick={() => updateField('categoryId', cat.id)}
                                    >
                                        <span className={styles.categoryIcon}>{cat.icon}</span>
                                        <span>{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Description * (minimum 50 characters)</label>
                            <textarea
                                value={formData.description}
                                onChange={e => updateField('description', e.target.value)}
                                placeholder="Tell potential clients about your services, experience, and what makes you special..."
                                className={styles.textarea}
                                rows={5}
                                required
                                minLength={50}
                            />
                            <span className={styles.charCount}>
                                {formData.description.length}/50 minimum
                            </span>
                        </div>
                    </div>
                )}

                {/* Step 2: Location & Contact */}
                {step === 2 && (
                    <div className={styles.stepContent}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Suburb *</label>
                                <input
                                    type="text"
                                    value={formData.suburb}
                                    onChange={e => updateField('suburb', e.target.value)}
                                    placeholder="e.g. Paddington"
                                    className={styles.input}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Postcode *</label>
                                <input
                                    type="text"
                                    value={formData.postcode}
                                    onChange={e => updateField('postcode', e.target.value)}
                                    placeholder="e.g. 4064"
                                    className={styles.input}
                                    required
                                    maxLength={4}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Service Radius (km)</label>
                            <input
                                type="range"
                                min="5"
                                max="50"
                                value={formData.serviceRadius}
                                onChange={e => updateField('serviceRadius', parseInt(e.target.value))}
                                className={styles.range}
                            />
                            <span className={styles.rangeValue}>{formData.serviceRadius} km</span>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => updateField('email', e.target.value)}
                                placeholder="contact@yourbusiness.com"
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => updateField('phone', e.target.value)}
                                placeholder="0400 000 000"
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Website</label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={e => updateField('website', e.target.value)}
                                    placeholder="https://..."
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Booking URL</label>
                                <input
                                    type="url"
                                    value={formData.bookingUrl}
                                    onChange={e => updateField('bookingUrl', e.target.value)}
                                    placeholder="https://..."
                                    className={styles.input}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Details */}
                {step === 3 && (
                    <div className={styles.stepContent}>
                        <div className={styles.formGroup}>
                            <label>Price Range</label>
                            <div className={styles.priceOptions}>
                                {['$', '$$', '$$$'].map(price => (
                                    <button
                                        key={price}
                                        type="button"
                                        className={`${styles.priceOption} ${formData.priceRange === price ? styles.selected : ''}`}
                                        onClick={() => updateField('priceRange', price)}
                                    >
                                        <span className={styles.priceSymbol}>{price}</span>
                                        <span className={styles.priceLabel}>
                                            {price === '$' ? 'Budget' : price === '$$' ? 'Mid-range' : 'Premium'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Dog Sizes Accepted</label>
                            <div className={styles.checkboxGrid}>
                                {DOG_SIZES.map(size => (
                                    <label key={size} className={styles.checkbox}>
                                        <input
                                            type="checkbox"
                                            checked={formData.dogSizes.includes(size)}
                                            onChange={() => toggleDogSize(size)}
                                        />
                                        <span>{size}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Services Offered</label>
                            <div className={styles.serviceInput}>
                                <input
                                    type="text"
                                    value={newService}
                                    onChange={e => setNewService(e.target.value)}
                                    placeholder="e.g. Full groom, Nail trimming..."
                                    className={styles.input}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addService())}
                                />
                                <button type="button" onClick={addService} className={styles.addBtn}>
                                    + Add
                                </button>
                            </div>
                            {formData.services.length > 0 && (
                                <div className={styles.serviceTags}>
                                    {formData.services.map(service => (
                                        <span key={service} className={styles.serviceTag}>
                                            {service}
                                            <button type="button" onClick={() => removeService(service)}>×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className={styles.formActions}>
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={() => setStep(s => s - 1)}
                            className={styles.backBtn}
                        >
                            ← Back
                        </button>
                    )}

                    {step < 3 ? (
                        <button
                            type="button"
                            onClick={() => setStep(s => s + 1)}
                            disabled={!canProceed()}
                            className={styles.nextBtn}
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.submitBtn}
                        >
                            {loading ? 'Submitting...' : 'Submit for Review'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
