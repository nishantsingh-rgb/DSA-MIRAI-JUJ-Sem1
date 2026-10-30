#include <iostream>
#include <algorithm>
#include <string>
#include <utility>
#include <vector>
using namespace std;

struct Student {
    string name;
    int marks;
};

int main() {
    vector<pair<string, int>> v = {{"Ravi", 72}, {"Asha", 85}, {"Kiran", 64}, {"Meena", 91}};

    sort(v.begin(), v.end());                       // default: by .first (name)
    cout << "By name : ";
    for (auto p : v) {
        cout << p.first << "(" << p.second << ") ";
    }
    cout << endl;

    sort(v.begin(), v.end(), [](const pair<string, int> &a, const pair<string, int> &b) {
        return a.second < b.second;                 // by .second (marks)
    });
    cout << "By marks: ";
    for (auto p : v) {
        cout << p.first << "(" << p.second << ") ";
    }
    cout << endl;

    // the same idea with a struct: highest marks first
    vector<Student> s = {{"Ravi", 72}, {"Asha", 85}, {"Kiran", 64}, {"Meena", 91}};
    sort(s.begin(), s.end(), [](const Student &a, const Student &b) {
        return a.marks > b.marks;
    });
    cout << "Struct, best first: ";
    for (auto st : s) {
        cout << st.name << "(" << st.marks << ") ";
    }
    cout << endl;
    return 0;
}
