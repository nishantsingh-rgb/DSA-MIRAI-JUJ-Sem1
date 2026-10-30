#include <iostream>
#include <iomanip>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {12, 45, 7, 30, 18, 60};
    int n = arr.size();

    // pass 1: find the average
    int sum = 0;
    for (int x : arr) {
        sum += x;
    }
    double avg = (double)sum / n;
    cout << fixed << setprecision(2) << "Average = " << avg << endl;

    // pass 2: count elements greater than the average
    int count = 0;
    cout << "Above average: ";
    for (int x : arr) {
        if (x > avg) {
            cout << x << " ";
            count++;
        }
    }
    cout << endl;
    cout << "Count = " << count << endl;
    return 0;
}
