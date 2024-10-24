import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Modal,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  User,
  Globe2,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Sun,
  Moon,
  Check,
  X,
  Clock,
  Search,
  CheckCircle,
  Circle,
} from 'lucide-react-native';

type Country = {
  name: {
    common: string;
  };
};

type Task = {
  id: string;
  userAssigned: string;
  country: string;
  description: string;
  timestamp: string;
  isCompleted: boolean;
  completedAt?: string;
};


export default function Index() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userAssigned, setUserAssigned] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [slideAnimation] = useState(new Animated.Value(0));
  

 

  // Fetch countries from API
  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all")
      .then((response) => response.json())
      .then((data) => {
        setCountries(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching countries:", error);
        setLoading(false);
      });
  }, []);

  // Load tasks from AsyncStorage
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const storedTasks = await AsyncStorage.getItem("tasks");
        if (storedTasks) {
          setTasks(JSON.parse(storedTasks));
        }
      } catch (error) {
        console.error("Error loading tasks:", error);
      }
    };

    loadTasks();
  }, []);

  // Fetching suggestions
  const fetchCountrySuggestions = async (query: string) => {
    if (!query) {
      setCountrySuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://restcountries.com/v3.1/name/${query}`
      );
      const data = await response.json();
      const countries = data.map((country: any) => country.name.common);
      setCountrySuggestions(countries);
    } catch (error) {
      console.error("Error fetching country suggestions:", error);
      setCountrySuggestions([]);
    }
  };

  // Add task function
  const addTask = async () => {
    if (!userAssigned.trim() || !country.trim() || !description.trim()) {
      Alert.alert("Missing Information", "Please fill in all fields");
      return;
    }

    if (description.length > 120) {
      Alert.alert("Description too long", "Maximum 120 characters allowed.");
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      userAssigned,
      country,
      description,
      timestamp: new Date().toLocaleString(),
      isCompleted: false
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);

    try {
      await AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));
      Alert.alert("Success", "Task added successfully");
    } catch (error) {
      console.error("Error saving task:", error);
      Alert.alert("Error", "Failed to save task");
    }

    resetForm();
  };

  // Toggle task completion
  const toggleTaskCompletion = async (taskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          isCompleted: !task.isCompleted,
          completedAt: !task.isCompleted ? new Date().toLocaleString() : undefined
        };
      }
      return task;
    });

    try {
      await AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error updating task completion:", error);
      Alert.alert("Error", "Failed to update task status");
    }
  };

  // Delete task function
  const deleteTask = async (taskId: string) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedTasks = tasks.filter(task => task.id !== taskId);
            setTasks(updatedTasks);
            try {
              await AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));
              Alert.alert("Success", "Task deleted successfully");
            } catch (error) {
              console.error("Error deleting task:", error);
              Alert.alert("Error", "Failed to delete task");
            }
          }
        }
      ]
    );
  };

  // Start editing task
  const startEditing = (task: Task) => {
    setEditingTask(task);
    setUserAssigned(task.userAssigned);
    setCountry(task.country);
    setDescription(task.description);
    setIsEditing(true);
  };

  // Update task function
  const updateTask = async () => {
    if (!editingTask) return;

    if (!userAssigned.trim() || !country.trim() || !description.trim()) {
      Alert.alert("Missing Information", "Please fill in all fields");
      return;
    }

    const updatedTasks = tasks.map(task => {
      if (task.id === editingTask.id) {
        return {
          ...task,
          userAssigned,
          country,
          description,
          timestamp: new Date().toLocaleString(),
          // Preserve completion status when editing
          isCompleted: task.isCompleted,
          completedAt: task.completedAt
        };
      }
      return task;
    });

    try {
      await AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      Alert.alert("Success", "Task updated successfully");
      resetForm();
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "Failed to update task");
    }
  };


  // Reset form function
  const resetForm = () => {
    setUserAssigned("");
    setCountry("");
    setDescription("");
    setIsEditing(false);
    setEditingTask(null);
  };

  // Render task actions
  const renderTaskActions = (task: Task) => (
    <View className="flex-row justify-end mt-2">
      <TouchableOpacity
        className="bg-yellow-500 px-4 py-2 rounded-md mr-2"
        onPress={() => startEditing(task)}
      >
        <Text className="text-white">Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="bg-red-500 px-4 py-2 rounded-md"
        onPress={() => deleteTask(task.id)}
      >
        <Text className="text-white">Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <GestureHandlerRootView className={`flex-1 bg-${isDarkMode ? 'gray-900' : 'white'}`}>
    <StatusBar
      barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      backgroundColor={isDarkMode ? '#1a1a1a' : '#f5f5f5'}
    />
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className={`p-4 bg-${isDarkMode ? 'gray-800' : 'white'} border-b border-${isDarkMode ? 'gray-700' : 'gray-200'}`}>
        <View className="flex-row justify-between items-center">
          <Text className={`text-2xl font-bold text-${isDarkMode ? 'white' : 'gray-800'}`}>
            Task Manager
          </Text>
          <TouchableOpacity
            className={`p-2 rounded-full bg-${isDarkMode ? 'gray-700' : 'gray-200'}`}
            onPress={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? (
              <Sun size={24} color="#ffffff" />
            ) : (
              <Moon size={24} color="#1a1a1a" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <>
          <View className={`p-4 rounded-lg bg-${isDarkMode ? 'gray-800' : 'white'} shadow`}>
            <View className="relative">
              <User 
                size={20} 
                color={isDarkMode ? '#999999' : '#888888'} 
                className="absolute left-3 top-3 z-10" 
              />
              <TextInput
                className={`bg-${isDarkMode ? 'gray-700' : 'gray-200'} rounded-md p-3 pl-10 mb-3 text-${isDarkMode ? 'white' : 'gray-800'}`}
                placeholder="Assign to"
                placeholderTextColor={isDarkMode ? '#999999' : '#888888'}
                value={userAssigned}
                onChangeText={setUserAssigned}
              />
            </View>

            <View className="relative">
              <Globe2 
                size={20} 
                color={isDarkMode ? '#999999' : '#888888'} 
                className="absolute left-3 top-3 z-10" 
              />
              <TextInput
                className={`bg-${isDarkMode ? 'gray-700' : 'gray-200'} rounded-md p-3 pl-10 mb-3 text-${isDarkMode ? 'white' : 'gray-800'}`}
                placeholder="Enter country"
                placeholderTextColor={isDarkMode ? '#999999' : '#888888'}
                value={country}
                onChangeText={(text) => {
                  setCountry(text);
                  fetchCountrySuggestions(text);
                }}
              />
            </View>

            {countrySuggestions.length > 0 && (
              <View className={`bg-${isDarkMode ? 'gray-700' : 'white'} rounded-md mb-3`}>
                <FlatList
                  data={countrySuggestions}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className={`p-3 flex-row items-center border-b border-${isDarkMode ? 'gray-600' : 'gray-200'}`}
                      onPress={() => {
                        setCountry(item);
                        setCountrySuggestions([]);
                      }}
                    >
                      <Search size={16} color={isDarkMode ? '#ffffff' : '#1a1a1a'} className="mr-2" />
                      <Text className={`text-${isDarkMode ? 'white' : 'gray-800'}`}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            <View className="relative">
              <FileText 
                size={20} 
                color={isDarkMode ? '#999999' : '#888888'} 
                className="absolute left-3 top-3 z-10" 
              />
              <TextInput
                className={`bg-${isDarkMode ? 'gray-700' : 'gray-200'} rounded-md p-3 pl-10 mb-3 text-${isDarkMode ? 'white' : 'gray-800'}`}
                placeholder="Description (max 120 characters)"
                placeholderTextColor={isDarkMode ? '#999999' : '#888888'}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={120}
              />
            </View>

            <TouchableOpacity
              className={`${isEditing ? 'bg-green-600' : 'bg-blue-600'} p-4 rounded-md flex-row justify-center items-center`}
              onPress={isEditing ? updateTask : addTask}
            >
              {isEditing ? (
                <Check size={20} color="#ffffff" className="mr-2" />
              ) : (
                <Plus size={20} color="#ffffff" className="mr-2" />
              )}
              <Text className="text-white font-semibold">
                {isEditing ? "Update Task" : "Add Task"}
              </Text>
            </TouchableOpacity>

            {isEditing && (
              <TouchableOpacity
                className="bg-gray-500 p-4 rounded-md flex-row justify-center items-center mt-2"
                onPress={resetForm}
              >
                <X size={20} color="#ffffff" className="mr-2" />
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

           <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View 
            className={`p-4 rounded-lg mb-4 bg-${isDarkMode ? 'gray-800' : 'white'} shadow ${
              item.isCompleted ? 'opacity-75' : ''
            }`}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center flex-1">
                <TouchableOpacity
                  onPress={() => toggleTaskCompletion(item.id)}
                  className="mr-2"
                >
                  {item.isCompleted ? (
                    <CheckCircle size={24} color={isDarkMode ? '#4CAF50' : '#2E7D32'} />
                  ) : (
                    <Circle size={24} color={isDarkMode ? '#999999' : '#666666'} />
                  )}
                </TouchableOpacity>
                <Text 
                  className={`text-lg font-semibold text-${isDarkMode ? 'white' : 'gray-800'} ${
                    item.isCompleted ? 'line-through' : ''
                  }`}
                >
                  {item.userAssigned}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center mt-2 ml-8">
              <Globe2 size={16} color={isDarkMode ? '#999999' : '#666666'} className="mr-2" />
              <Text 
                className={`text-${isDarkMode ? 'gray-400' : 'gray-600'} ${
                  item.isCompleted ? 'line-through' : ''
                }`}
              >
                {item.country}
              </Text>
            </View>

            <View className="flex-row items-center mt-2 ml-8">
              <FileText size={16} color={isDarkMode ? '#ffffff' : '#1a1a1a'} className="mr-2" />
              <Text 
                className={`text-${isDarkMode ? 'white' : 'gray-800'} ${
                  item.isCompleted ? 'line-through' : ''
                }`}
              >
                {item.description}
              </Text>
            </View>

            <View className="flex-row items-center mt-2 ml-8">
              <Clock size={16} color={isDarkMode ? '#999999' : '#666666'} className="mr-2" />
              <Text className={`text-${isDarkMode ? 'gray-400' : 'gray-600'}`}>
                {item.isCompleted ? 'Completed: ' + item.completedAt : 'Created: ' + item.timestamp}
              </Text>
            </View>

            {!item.isCompleted && (
              <View className="flex-row justify-end mt-3">
                <TouchableOpacity
                  className="bg-yellow-500 px-4 py-2 rounded-md mr-2 flex-row items-center"
                  onPress={() => startEditing(item)}
                >
                  <Edit2 size={16} color="#ffffff" className="mr-1" />
                  <Text className="text-white">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-red-500 px-4 py-2 rounded-md flex-row items-center"
                  onPress={() => deleteTask(item.id)}
                >
                  <Trash2 size={16} color="#ffffff" className="mr-1" />
                  <Text className="text-white">Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
            )}
          />
        </>
      )}
    </KeyboardAvoidingView>
  </GestureHandlerRootView>
  );
}
