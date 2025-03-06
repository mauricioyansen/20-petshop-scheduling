"use strict";

import "./libs/dayjs.js";
import "./styles/styles.css";
import dayjs from "dayjs";

document.addEventListener("DOMContentLoaded", () => {
  const newAppointmentBtn = document.querySelector(".btn button");
  const modal = document.querySelector(".modal");
  const scheduleContainer = document.querySelector(".schedule-container");
  const submitButton = document.querySelector(".modal-btn button");
  const timeInput = document.querySelector("#time");
  const nameInput = document.querySelector("#name");
  const petInput = document.querySelector("#pet");
  const descriptionInput = document.querySelector("#description");
  const telInput = document.querySelector("#tel");
  const dateInput = document.querySelector("#date");
  const dateArrow = document.querySelector(
    ".date .input-date-time img:last-child"
  );
  const timeArrow = document.querySelector(
    ".time .input-date-time img:last-child"
  );
  const calendarDate = document.querySelector(".calendar input[type='date']");
  const calendarArrow = document.querySelector(".calendar img:last-child");

  const scheduleList = {
    morning: document.querySelector(".morning .clients-morning"),
    afternoon: document.querySelector(".afternoon .clients-morning"),
    night: document.querySelector(".night .clients-morning"),
  };

  const openingHours = {
    morning: ["09:00", "10:00", "11:00", "12:00"],
    afternoon: ["13:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
    night: ["19:00", "20:00", "21:00"],
  };

  function loadAppointments(date, isModal = false) {
    fetch("http://localhost:3333/schedules")
      .then((response) => response.json())
      .then((data) => {
        if (!isModal) {
          // Limpar a lista de agendamentos apenas quando não estiver no modal
          Object.values(scheduleList).forEach((list) => (list.innerHTML = ""));
        }

        const filteredAppointments = data.filter(
          (appointment) => appointment.date === date
        );

        // Prevenir que o calendário no modal interfira com o calendário da lista de agendamentos
        if (!isModal) {
          filteredAppointments.forEach((appointment) => {
            addAppointment(
              appointment.id,
              appointment.period,
              appointment.time,
              appointment.petName,
              appointment.ownerName,
              appointment.description,
              false
            );
          });
        }
      });
  }

  newAppointmentBtn.addEventListener("click", () => {
    modal.style.display = "flex";
    scheduleContainer.style.filter = "blur(5px)";
    const today = new Date().toISOString().split("T")[0];
    loadAppointments(today, true); // Carregar agendamentos para o calendário no modal
    dateInput.value = today;
    timeInput.disabled = false; // Habilitar o campo de horário ao abrir o modal
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  submitButton.addEventListener("click", () => {
    const hour = timeInput.value;
    const ownerName = nameInput.value;
    const petName = petInput.value;
    const description = descriptionInput.value;
    const date = dateInput.value;

    if (!hour || !ownerName || !petName || !description || !date) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    let period = "";
    if (openingHours.morning.includes(hour)) {
      period = "morning";
    } else if (openingHours.afternoon.includes(hour)) {
      period = "afternoon";
    } else if (openingHours.night.includes(hour)) {
      period = "night";
    }

    if (period) {
      const newAppointment = {
        date,
        time: hour,
        petName,
        ownerName,
        description,
        period,
      };
      fetch("http://localhost:3333/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAppointment),
      })
        .then((response) => response.json())
        .then((data) => {
          // Adiciona o agendamento na lista para a data correta
          if (data.date === calendarDate.value) {
            addAppointment(
              data.id,
              data.period,
              data.time,
              data.petName,
              data.ownerName,
              data.description
            );
          }
          closeModal();

          // Atualiza a tela de agendamentos para refletir a nova data de agendamento
          loadAppointments(calendarDate.value); // Atualiza os agendamentos para a data em que o novo agendamento foi criado
        });
    } else {
      alert("Horário inválido.");
    }
  });

  function addAppointment(id, period, hour, petName, ownerName, description) {
    const appointmentItem = document.createElement("div");
    appointmentItem.classList.add("item-morning");
    appointmentItem.innerHTML = ` 
              <p class="hour">${hour}</p>
              <div class="pet-name-owner-name">
                  <span class="pet-name">${petName}&nbsp</span>
                  <span class="owner-name">/ ${ownerName}</span>
              </div>
              <p class="description">${description}</p>
              <div class="remove-item">
                  <p>Remover agendamento</p>
              </div>
          `;

    appointmentItem
      .querySelector(".remove-item")
      .addEventListener("click", () => {
        appointmentItem.remove();
        fetch(`http://localhost:3333/schedules/${id}`, {
          method: "DELETE",
        });
      });

    scheduleList[period].appendChild(appointmentItem);
  }

  function closeModal() {
    modal.style.display = "none";
    scheduleContainer.style.filter = "none";
    nameInput.value = "";
    petInput.value = "";
    descriptionInput.value = "";
    telInput.value = "";
    timeInput.value = "";
    dateInput.value = "";

    // Resetar o calendário dentro do modal
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today; // Resetar para a data de hoje
    timeInput.disabled = true; // Desabilitar o campo de horário ao fechar o modal
    const timeDropdown = document.querySelector(".time-dropdown");
    if (timeDropdown) {
      timeDropdown.remove();
    }
  }

  // Calendário dentro do modal
  dateArrow.addEventListener("click", () => {
    dateInput.showPicker(); // Chama o calendário nativo
  });

  // Calendário fora do modal
  const today = new Date().toISOString().split("T")[0];
  loadAppointments(today); // Carregar agendamentos para a data de hoje
  calendarDate.value = today; // Atualiza o valor do input de data com a data de hoje
  calendarDate.setAttribute("min", today); // Garantir que o input não permita datas passadas

  calendarArrow.addEventListener("click", () => {
    calendarDate.showPicker(); // Abre o picker de data ao clicar no ícone
  });

  calendarDate.addEventListener("change", () => {
    loadAppointments(calendarDate.value); // Carregar os agendamentos para a nova data selecionada
    timeInput.disabled = false; // Habilitar o campo de horário quando uma data for selecionada
  });

  // Quando a data do calendário dentro do modal mudar
  dateInput.setAttribute("min", today); // Garantir que o input do modal não permita datas passadas
  dateInput.addEventListener("change", () => {
    loadAppointments(dateInput.value, true); // Passar "true" para indicar que é o modal
    timeInput.disabled = false; // Habilitar o campo de horário quando uma data for selecionada
  });

  // Ao abrir o modal, carregamos os horários disponíveis no campo de hora
  timeArrow.addEventListener("click", () => {
    // Verifica se já existe uma div com a lista de horários, se sim, remove-a
    const existingDropdown = document.querySelector(".time-dropdown");
    if (existingDropdown) {
      existingDropdown.remove();
    }

    fetch("http://localhost:3333/schedules")
      .then((response) => response.json())
      .then((data) => {
        const selectedDate = dateInput.value;
        const bookedTimes = data
          .filter((appointment) => appointment.date === selectedDate)
          .map((a) => a.time);

        // Obtém o horário atual
        const currentTime = dayjs();
        const isToday = dayjs().isSame(selectedDate, "day");

        const timeDropdown = document.createElement("div");
        timeDropdown.classList.add("time-dropdown");
        timeDropdown.style.position = "absolute";
        timeDropdown.style.background = "#23242c";
        timeDropdown.style.font = "700 0.875rem/1.5rem var(--ff-inter)";
        timeDropdown.style.color = "#98959d";
        timeDropdown.style.border = "1px solid #ccc";
        timeDropdown.style.padding = "5px";
        timeDropdown.style.zIndex = "1000";
        timeDropdown.style.overflowY = "auto"; // Habilita o scroll vertical
        timeDropdown.style.maxHeight = "15rem";

        Object.values(openingHours)
          .flat()
          .forEach((hour) => {
            // Converte o horário para um objeto dayjs para comparar
            const [hourHour, hourMinute] = hour.split(":").map(Number);
            const hourTime = dayjs().hour(hourHour).minute(hourMinute);

            // Desabilita horários passados
            if (isToday && hourTime.isBefore(currentTime)) {
              return; // Skip past times
            }

            if (!bookedTimes.includes(hour)) {
              const option = document.createElement("div");
              option.textContent = hour;
              option.style.padding = "5px";
              option.style.cursor = "pointer";
              option.addEventListener("click", () => {
                timeInput.value = hour;
                document.body.removeChild(timeDropdown);
              });
              timeDropdown.appendChild(option);
            }
          });

        document.body.appendChild(timeDropdown);
        const rect = timeInput.getBoundingClientRect();
        timeDropdown.style.top = `${rect.bottom}px`;
        timeDropdown.style.left = `${rect.left}px`;
      });
  });
});

