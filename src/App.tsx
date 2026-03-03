import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Mail, 
  Phone,
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Loader2,
  Scissors,
  Instagram,
  MapPin
} from 'lucide-react';
import { Booking, TimeSlot } from './types';

const HOURS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function App() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [showModal, setShowModal] = useState(false);
  const [lastBooking, setLastBooking] = useState<{ date: string, time: string } | null>(null);

  const dateString = selectedDate.toISOString().split('T')[0];

  useEffect(() => {
    fetchBookings();

    // Setup WebSocket connection for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'BOOKING_UPDATED' && data.date === dateString) {
        fetchBookings();
      }
    };

    return () => {
      socket.close();
    };
  }, [dateString]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?date=${dateString}`);
      const data = await res.json();
      setBookedSlots(data.map((b: { time: string }) => b.time));
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime) return;

    // Validation
    const newErrors: { email?: string } = {};
    
    // Email validation (specifically checking for Gmail as requested)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Por favor, ingresa un correo de Gmail válido (@gmail.com)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setBookingStatus('submitting');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: dateString,
          time: selectedTime
        })
      });

      if (res.ok) {
        setBookingStatus('success');
        setLastBooking({ date: dateString, time: selectedTime });
        
        // Construct WhatsApp message
        const message = `Hola! He realizado una reserva en *Reserva Wellness*:%0A%0A` +
          `*Nombre:* ${formData.name}%0A` +
          `*Email:* ${formData.email}%0A` +
          `*Teléfono:* ${formData.phone}%0A` +
          `*Fecha:* ${new Date(dateString + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}%0A` +
          `*Hora:* ${selectedTime} hs`;
        
        const whatsappUrl = `https://wa.me/5492243497070?text=${message}`;

        fetchBookings();
        
        setTimeout(() => {
          setShowModal(true);
          setBookingStatus('idle');
          setSelectedTime(null);
          setFormData({ name: '', email: '', phone: '' });
          
          // Wait 4 seconds before opening WhatsApp so the user can read the message on the card
          setTimeout(() => {
            window.open(whatsappUrl, '_blank');
          }, 4000);
        }, 1000);
      } else {
        setBookingStatus('error');
      }
    } catch (err) {
      setBookingStatus('error');
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    setSelectedTime(null);
  };

  const isDateInPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="min-h-screen bg-bg-beige py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 mb-6 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center border border-brand-500/10 shadow-xl overflow-hidden"
          >
            {/* Placeholder for the user's logo image */}
            <div className="relative flex items-center justify-center w-full h-full text-brand-500">
               <span className="text-6xl font-serif font-bold">W</span>
               <Scissors className="absolute bottom-4 right-4 w-8 h-8 rotate-12 opacity-80" />
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold font-serif text-brand-500 tracking-tight mb-2"
          >
            Reserva Wellness
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-brand-500/70 text-lg font-serif italic"
          >
            Estilo y elegancia en cada turno.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar & Date Selection */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white/60 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-serif font-bold flex items-center gap-3 text-brand-500">
                  <CalendarIcon className="w-6 h-6" />
                  Selecciona una Fecha
                </h2>
                <div className="flex gap-3">
                  <button 
                    onClick={() => changeDate(-1)}
                    disabled={isDateInPast(new Date(selectedDate.getTime() - 86400000))}
                    className="p-3 hover:bg-brand-500 hover:text-white rounded-full disabled:opacity-20 transition-all duration-300 border border-brand-500/20"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => changeDate(1)}
                    className="p-3 hover:bg-brand-500 hover:text-white rounded-full transition-all duration-300 border border-brand-500/20"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="text-center py-6 bg-brand-500/5 rounded-2xl mb-8 border border-brand-500/10">
                <span className="text-3xl font-serif font-bold text-brand-500">
                  {selectedDate.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long'
                  })}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {HOURS.map((hour) => {
                  const isBooked = bookedSlots.includes(hour);
                  const isSelected = selectedTime === hour;
                  
                  return (
                    <button
                      key={hour}
                      disabled={isBooked || loading}
                      onClick={() => setSelectedTime(hour)}
                      className={`
                        relative py-5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2
                        ${isBooked 
                          ? 'bg-transparent border-brand-500/10 text-brand-500/20 cursor-not-allowed' 
                          : isSelected
                            ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/30 scale-105'
                            : 'bg-white/40 border-brand-500/10 hover:border-brand-500/40 hover:bg-white/60 text-brand-500/80'
                        }
                      `}
                    >
                      <Clock className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-brand-500/40'}`} />
                      <span className="font-bold tracking-wide">{hour}</span>
                      {isBooked && (
                        <span className="text-[9px] uppercase tracking-widest font-black opacity-40">Ocupado</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedTime ? (
                <motion.section
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 p-8 sticky top-8"
                >
                  <h2 className="text-2xl font-serif font-bold mb-8 flex items-center gap-3 text-brand-500">
                    <User className="w-6 h-6" />
                    Tus Datos
                  </h2>

                  <div className="mb-8 p-5 bg-brand-500/5 rounded-2xl border border-brand-500/10">
                    <p className="text-xs text-brand-500/60 font-bold uppercase tracking-widest mb-1">Resumen del turno</p>
                    <p className="text-brand-500 text-2xl font-serif font-bold">{selectedTime} hs</p>
                    <p className="text-brand-500/70 text-sm italic">
                      {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>

                  <form onSubmit={handleBooking} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-brand-500/60 uppercase tracking-widest mb-2">Nombre Completo</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500/40" />
                        <input
                          required
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-white/50 border border-brand-500/10 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-brand-500/20"
                          placeholder="Ej: Juan Pérez"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-500/60 uppercase tracking-widest mb-2">Correo Electrónico</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500/40" />
                        <input
                          required
                          type="email"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            if (errors.email) setErrors({ ...errors, email: undefined });
                          }}
                          className={`w-full pl-12 pr-4 py-3 bg-white/50 border ${errors.email ? 'border-red-500' : 'border-brand-500/10'} rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-brand-500/20`}
                          placeholder="juan@gmail.com"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-500/60 uppercase tracking-widest mb-2">Número de Teléfono</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500/40" />
                        <input
                          required
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-white/50 border border-brand-500/10 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-brand-500/20"
                          placeholder="Ej: +54 9 11 1234-5678"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={bookingStatus === 'submitting'}
                      className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                    >
                      {bookingStatus === 'submitting' ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        'Confirmar Reserva'
                      )}
                    </button>

                    {bookingStatus === 'success' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-bold">¡Reserva confirmada!</span>
                      </motion.div>
                    )}

                    {bookingStatus === 'error' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 text-rose-700 bg-rose-50 p-4 rounded-xl border border-rose-100"
                      >
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-bold">Error al procesar.</span>
                      </motion.div>
                    )}
                  </form>
                </motion.section>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/20 border-2 border-dashed border-brand-500/10 rounded-3xl text-brand-500/40"
                >
                  <Scissors className="w-16 h-16 mb-6 opacity-10 rotate-45" />
                  <p className="font-serif italic text-lg">Selecciona un horario para tu sesión</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <footer className="mt-24 text-center text-brand-500/40 text-sm font-serif italic">
          <p>&copy; {new Date().getFullYear()} Reserva Wellness. Estilo y Distinción.</p>
        </footer>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showModal && lastBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-brand-700/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-md bg-bg-beige rounded-[40px] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="bg-brand-500 p-10 text-center text-white">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6 border border-white/20">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold font-serif mb-2">¡Todo Listo!</h3>
                <p className="text-brand-100 font-serif italic mb-4">Tu turno ha sido agendado con éxito.</p>
                <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                  <p className="text-sm text-white font-serif leading-relaxed">
                    Ahora te redireccionaremos a WhatsApp con un mensaje con la información de dicha reserva al barbero Joshua.
                  </p>
                </div>
              </div>
              
              <div className="p-10">
                <div className="space-y-5 mb-10">
                  <div className="flex items-center gap-5 p-5 bg-white/40 rounded-3xl border border-brand-500/5">
                    <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-brand-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-brand-500/40 font-black uppercase tracking-widest mb-1">Fecha</p>
                      <p className="text-brand-500 font-serif font-bold text-xl">
                        {new Date(lastBooking.date + 'T00:00:00').toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 p-5 bg-white/40 rounded-3xl border border-brand-500/5">
                    <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-brand-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-brand-500/40 font-black uppercase tracking-widest mb-1">Horario</p>
                      <p className="text-brand-500 font-serif font-bold text-xl">{lastBooking.time} hs</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-brand-500/20 text-lg"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Google Maps Floating Bubble */}
      <motion.a
        href="https://www.google.com/maps/search/?api=1&query=Reserva+Wellness"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-48 right-8 z-40 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 hover:bg-blue-700 transition-colors group"
      >
        <MapPin className="w-8 h-8 transition-transform group-hover:scale-110" />
        <span className="absolute right-full mr-4 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
          Cómo llegar
        </span>
      </motion.a>

      {/* WhatsApp Floating Bubble */}
      <motion.a
        href="https://wa.me/5492243418025"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.1, rotate: -5 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-28 right-8 z-40 w-16 h-16 bg-[#25D366] text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 hover:bg-[#128C7E] transition-colors group"
      >
        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        <span className="absolute right-full mr-4 px-3 py-1 bg-[#25D366] text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
          Chatea con nosotros
        </span>
      </motion.a>

      {/* Instagram Floating Bubble */}
      <motion.a
        href="https://www.instagram.com/wellness.jb/"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-brand-500 text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 hover:bg-brand-600 transition-colors group"
      >
        <Instagram className="w-8 h-8 transition-transform group-hover:scale-110" />
        <span className="absolute right-full mr-4 px-3 py-1 bg-brand-500 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
          Síguenos en Instagram
        </span>
      </motion.a>
    </div>
  );
}
