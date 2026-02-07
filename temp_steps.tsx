// Step 3: Institution & Year Details
const renderStep3 = () => (
    <View style={styles.stepContainer}>
        <Text style={styles.sectionTitle}>Institution Name *</Text>
        {renderInput('institution', '', 'school-outline', institutionName, setInstitutionName, 'Enter your college/school name', 'default')}

        <Text style={styles.sectionTitle}>Current Year / Semester *</Text>
        <View style={styles.chipContainer}>
            {YEAR_OPTIONS.map((item) => (
                <TouchableOpacity
                    key={item.id}
                    style={[styles.chip, currentYear === item.id && styles.chipSelected]}
                    onPress={() => setCurrentYear(item.id)}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.chipText, currentYear === item.id && styles.chipTextSelected]}>
                        {item.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>

        <Text style={styles.sectionTitle}>
            City <Text style={styles.optionalText}>(Optional)</Text>
        </Text>
        {renderInput('city', '', 'location-outline', city, setCity, 'e.g., Hyderabad', 'default')}

        <Text style={styles.sectionTitle}>
            Branch <Text style={styles.optionalText}>(Optional - for Engineering students)</Text>
        </Text>
        {renderInput('branch', '', 'git-branch-outline', branch, setBranch, 'e.g., Computer Science', 'default')}

        <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={loading}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.flexButton, styles.nextButtonShadow]}
                onPress={handleNext}
                disabled={loading || !institutionName || !currentYear}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={!institutionName || !currentYear ? ['#94A3B8', '#94A3B8'] : [COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButton}
                >
                    <Text style={styles.actionButtonText}>Next Step</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
            </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSkipStep3} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip optional fields →</Text>
        </TouchableOpacity>
    </View>
);

// Step 4: Interests & Personalization (All Optional)
const renderStep4 = () => {
    const toggleSelection = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    return (
        <View style={styles.stepContainer}>
            <Text style={styles.welcomeText}>🎉 Almost Done!</Text>
            <Text style={styles.welcomeSubtext}>
                Help us personalize your feed (all optional)
            </Text>

            <Text style={styles.sectionTitle}>
                Academic Interests <Text style={styles.optionalText}>(Select any)</Text>
            </Text>
            <View style={styles.chipContainer}>
                {ACADEMIC_INTERESTS.map((interest) => (
                    <TouchableOpacity
                        key={interest}
                        style={[styles.chip, academicInterests.includes(interest) && styles.chipSelected]}
                        onPress={() => toggleSelection(interest, academicInterests, setAcademicInterests)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.chipText, academicInterests.includes(interest) && styles.chipTextSelected]}>
                            {interest}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.sectionTitle}>
                Your Goals <Text style={styles.optionalText}>(Select any)</Text>
            </Text>
            <View style={styles.chipContainer}>
                {GOALS.map((goal) => (
                    <TouchableOpacity
                        key={goal}
                        style={[styles.chip, goals.includes(goal) && styles.chipSelected]}
                        onPress={() => toggleSelection(goal, goals, setGoals)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.chipText, goals.includes(goal) && styles.chipTextSelected]}>
                            {goal}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.sectionTitle}>
                Hobbies <Text style={styles.optionalText}>(Select any)</Text>
            </Text>
            <View style={styles.chipContainer}>
                {HOBBIES.map((hobby) => (
                    <TouchableOpacity
                        key={hobby}
                        style={[styles.chip, hobbies.includes(hobby) && styles.chipSelected]}
                        onPress={() => toggleSelection(hobby, hobbies, setHobbies)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.chipText, hobbies.includes(hobby) && styles.chipTextSelected]}>
                            {hobby}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={loading}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.flexButton, styles.nextButtonShadow]}
                    onPress={handleSignup}
                    disabled={loading}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.actionButton}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.actionButtonText}>Join the Verse</Text>
                                <Ionicons name="rocket-outline" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleSkipStep4} style={styles.skipButton}>
                <Text style={styles.skipText}>I'll do this later →</Text>
            </TouchableOpacity>
        </View>
    );
};
