import { useState, useEffect } from 'react';

interface Store {
  name: string;
  address: string;
  mapsUrl: string;
  closedDays: string[];
}

interface Props {
  stores: Store[];
  preSelectedProduct?: string;
}

export default function ReservationForm({ stores, preSelectedProduct }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    store: '',
    date: '',
    productType: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [minDate, setMinDate] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const today = new Date();
    today.setDate(today.getDate() + 3);
    const minDateStr = today.toISOString().split('T')[0];
    setMinDate(minDateStr);

    if (preSelectedProduct) {
      setFormData((prev) => ({
        ...prev,
        message: `Mám zájem o: ${preSelectedProduct}\n\n`,
      }));
    }
  }, [preSelectedProduct]);

  useEffect(() => {
    const checkForProduct = () => {
      const win = window as any;
      if (win.getSelectedProduct) {
        const product = win.getSelectedProduct();
        if (product && product !== '') {
          setFormData((prev) => ({
            ...prev,
            message: `Mám zájem o: ${product}\n\n`,
          }));
          if (win.clearSelectedProduct) {
            win.clearSelectedProduct();
          }
        }
      }
    };

    checkForProduct();
    const interval = setInterval(checkForProduct, 500);

    return () => clearInterval(interval);
  }, []);

  const getBlockedDaysForStore = (storeName: string): number[] => {
    const dayMap: Record<string, number> = {
      'Neděle': 0,
      'Pondělí': 1,
      'Úterý': 2,
      'Středa': 3,
      'Čtvrtek': 4,
      'Pátek': 5,
      'Sobota': 6,
    };

    switch (storeName) {
      case 'Petřvald':
        return [dayMap['Pondělí']];
      case 'Karviná':
      case 'Ostrava':
        return [dayMap['Neděle']];
      case 'Píšť':
        return [dayMap['Sobota'], dayMap['Neděle']];
      default:
        return [];
    }
  };

  const isDateBlocked = (date: string, storeName: string): boolean => {
    if (!date || !storeName) return false;

    const selectedDate = new Date(date + 'T00:00:00');
    const dayOfWeek = selectedDate.getDay();
    const blockedDays = getBlockedDaysForStore(storeName);

    return blockedDays.includes(dayOfWeek);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Jméno je povinné';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email je povinný';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Neplatný formát emailu';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon je povinný';
    } else if (!/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{3,6}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Neplatný formát telefonu';
    }

    if (!formData.store) {
      newErrors.store = 'Vyberte prodejnu';
    }

    if (!formData.date) {
      newErrors.date = 'Vyberte datum';
    } else if (formData.date < minDate) {
      newErrors.date = 'Datum musí být minimálně 3 dny dopředu';
    } else if (isDateBlocked(formData.date, formData.store)) {
      newErrors.date = 'Vybraná prodejna je v tento den zavřená';
    }

    if (!formData.productType) {
      newErrors.productType = 'Vyberte typ produktu';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Popis objednávky je povinný';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const form = e.target as HTMLFormElement;
    const formDataToSend = new FormData(form);

    try {
      const response = await fetch('https://formspree.io/f/your-form-id', {
        method: 'POST',
        body: formDataToSend,
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          store: '',
          date: '',
          productType: '',
          message: '',
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <svg
            className="w-16 h-16 text-green-500 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Děkujeme za vaši objednávku!</h3>
        <p className="text-gray-600 mb-6">Brzy vás budeme kontaktovat.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="bg-navy-900 text-white px-6 py-2 rounded-lg hover:bg-navy-800 transition-colors"
        >
          Nová rezervace
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
          Jméno a příjmení *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Jan Novák"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="jan.novak@email.cz"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
          Telefon *
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="+420 123 456 789"
        />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="store" className="block text-sm font-semibold text-gray-700 mb-2">
          Prodejna *
        </label>
        <select
          id="store"
          name="store"
          value={formData.store}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent ${
            errors.store ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Vyberte prodejnu</option>
          {stores.map((store) => (
            <option key={store.name} value={store.name}>
              {store.name}
            </option>
          ))}
        </select>
        {errors.store && <p className="text-red-500 text-sm mt-1">{errors.store}</p>}
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
          Datum vyzvednutí *
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          min={minDate}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent ${
            errors.date ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
        <p className="text-sm text-gray-600 mt-1">Minimálně 3 dny předem</p>
      </div>

      <div>
        <label htmlFor="productType" className="block text-sm font-semibold text-gray-700 mb-2">
          Typ produktu *
        </label>
        <select
          id="productType"
          name="productType"
          value={formData.productType}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent ${
            errors.productType ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Vyberte typ produktu</option>
          <option value="dort">Dort</option>
          <option value="zakusky">Zákusky</option>
          <option value="jine">Jiné</option>
        </select>
        {errors.productType && <p className="text-red-500 text-sm mt-1">{errors.productType}</p>}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
          Popis objednávky *
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent ${
            errors.message ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Popište vaši objednávku (velikost, příchutě, speciální požadavky...)"
        />
        {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
      </div>

      <button
        type="submit"
        className="w-full bg-navy-900 text-white py-3 rounded-lg font-semibold hover:bg-navy-800 transition-colors shadow-lg hover:shadow-xl"
      >
        Odeslat rezervaci
      </button>
    </form>
  );
}
