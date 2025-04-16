/**
 * Formata uma data para o padrão brasileiro (dd/mm/aaaa)
 * @param date Data a ser formatada
 * @returns String no formato dd/mm/aaaa
 */
export const formatDateBR = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Formata uma data e hora para o padrão brasileiro (dd/mm/aaaa HH:MM)
 * @param date Data a ser formatada
 * @returns String no formato dd/mm/aaaa HH:MM
 */
export const formatDateTimeBR = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}; 