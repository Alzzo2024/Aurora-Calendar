let currentDate = new Date();
let selectedDate = null;
let selectedColor = '#0066cc';
let events = {};
let currentLang = 'en';

if ('Notification' in window) {
    Notification.requestPermission();
}

function saveEvents() {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
}

function loadEvents() {
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
        events = JSON.parse(savedEvents);
        updateCalendar();
    }
}

function scheduleNotification(event, dateTime, notificationTime) {
    if (Notification.permission === "granted") {
        const notificationDateTime = new Date(dateTime.getTime() - (notificationTime * 60000));
        const now = new Date();
        
        if (notificationDateTime > now) {
            setTimeout(() => {
                new Notification(event.title, {
                    body: `${translations[currentLang].notification}: ${event.location}`,
                    icon: '/icon.png'
                });
            }, notificationDateTime.getTime() - now.getTime());
        }
    }
}

function updateCalendar() {
    const monthDisplay = document.getElementById('monthDisplay');
    const daysContainer = document.getElementById('daysContainer');
    
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    monthDisplay.textContent = `${translations[currentLang].monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    daysContainer.innerHTML = '';
    
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'day';
        daysContainer.appendChild(emptyDay);
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        dayElement.textContent = day;
        
        const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        if (events[dateStr]) {
            dayElement.classList.add('has-event');
            dayElement.style.setProperty('--event-color', events[dateStr].color);
            
            dayElement.addEventListener('click', () => {
                showEventDetails(events[dateStr], dateStr);
            });
        }
        
        if (day === new Date().getDate() && 
            currentDate.getMonth() === new Date().getMonth() && 
            currentDate.getFullYear() === new Date().getFullYear()) {
            dayElement.classList.add('today');
        }
        
        dayElement.addEventListener('click', () => {
            document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
            dayElement.classList.add('selected');
            selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        });
        
        daysContainer.appendChild(dayElement);
    }
}

function updateUIText() {
    document.querySelector('#eventModal h3').textContent = translations[currentLang].newEvent;
    document.getElementById('eventTitle').placeholder = translations[currentLang].title;
    document.getElementById('eventLocation').placeholder = translations[currentLang].location;
    document.getElementById('eventDescription').placeholder = translations[currentLang].description;
    document.getElementById('saveEvent').textContent = translations[currentLang].save;
    document.getElementById('cancelEvent').textContent = translations[currentLang].cancel;
    document.getElementById('deleteEvent').textContent = translations[currentLang].delete;
    document.getElementById('closeViewEvent').textContent = translations[currentLang].close;
    
    const weekdays = document.querySelectorAll('.weekday');
    weekdays.forEach((day, index) => {
        day.textContent = translations[currentLang].weekdays[index];
    });
}

function showEventDetails(event, dateStr) {
    const viewModal = document.getElementById('viewEventModal');
    document.getElementById('viewEventTitle').textContent = event.title;
    document.getElementById('viewEventDate').textContent = new Date(dateStr).toLocaleDateString(
        currentLang === 'pt' ? 'pt-PT' : currentLang === 'es' ? 'es-ES' : 'en-GB'
    );
    document.getElementById('viewEventTime').textContent = event.time;
    document.getElementById('viewEventLocation').textContent = event.location;
    document.getElementById('viewEventDescription').textContent = event.description;
    
    document.getElementById('deleteEvent').onclick = () => {
        delete events[dateStr];
        saveEvents();
        updateCalendar();
        viewModal.style.display = 'none';
    };
    
    document.getElementById('closeViewEvent').onclick = () => {
        viewModal.style.display = 'none';
    };
    
    viewModal.style.display = 'block';
}

document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedColor = option.dataset.color;
    });
});

document.getElementById('langToggle').addEventListener('click', () => {
    document.getElementById('languageModal').style.display = 'block';
});

document.querySelectorAll('.lang-option').forEach(option => {
    option.addEventListener('click', () => {
        currentLang = option.dataset.lang;
        updateCalendar();
        updateUIText();
        document.getElementById('languageModal').style.display = 'none';
    });
});

document.getElementById('cancelLanguage').addEventListener('click', () => {
    document.getElementById('languageModal').style.display = 'none';
});

const addButton = document.getElementById('addButton');
const modal = document.getElementById('eventModal');
const saveEvent = document.getElementById('saveEvent');
const cancelEvent = document.getElementById('cancelEvent');

addButton.addEventListener('click', () => {
    modal.style.display = 'block';
    if (selectedDate) {
        document.getElementById('eventDate').valueAsDate = selectedDate;
    }
});

cancelEvent.addEventListener('click', () => {
    modal.style.display = 'none';
});

saveEvent.addEventListener('click', () => {
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const location = document.getElementById('eventLocation').value;
    const description = document.getElementById('eventDescription').value;
    const enableNotification = document.getElementById('enableNotification').checked;
    const notificationTime = parseInt(document.getElementById('notificationTime').value);
    
    if (title && date) {
        const eventId = Date.now().toString();
        const eventData = {
            id: eventId,
            title,
            time,
            location,
            description,
            color: selectedColor,
            notification: enableNotification ? notificationTime : null
        };
        
        events[date] = eventData;
        
        if (enableNotification && time) {
            const [hours, minutes] = time.split(':');
            const eventDateTime = new Date(date);
            eventDateTime.setHours(parseInt(hours), parseInt(minutes));
            scheduleNotification(eventData, eventDateTime, notificationTime);
        }
        
        saveEvents();
        updateCalendar();
        modal.style.display = 'none';
        
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventTime').value = '';
        document.getElementById('eventLocation').value = '';
        document.getElementById('eventDescription').value = '';
        document.getElementById('enableNotification').checked = false;
    }
});

document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
});

window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

window.addEventListener('load', () => {
    loadEvents();
    updateUIText();
    updateCalendar();
});
