export default (sequelize, Sequelize) => {
  const Todo = sequelize.define("todo", {
    listId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    completed: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    dueDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
      get() {
        const raw = this.getDataValue("dueDate");
        if (!raw) {
          return null;
        }
        return String(raw).slice(0, 10);
      },
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  });

  return Todo;
};
